import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'

const MODEL_ID = 'gemini-2.0-flash'

interface ContextItemInput {
  id: string
  type: 'note' | 'folder' | 'file'
}

interface ChatRequestPayload {
  chatId?: string
  message: string
  contextItems?: ContextItemInput[]
  title?: string
  reset?: boolean
}

const geminiClient = (() => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(apiKey)
})()

async function upsertChatContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chatId: string,
  userId: string,
  contextItems: ContextItemInput[]
) {
  if (!contextItems?.length) return

  const payload = contextItems.map((item) => ({
    chat_id: chatId,
    user_id: userId,
    item_type: item.type,
    item_id: item.id,
  }))

  await supabase
    .from('ai_chat_contexts')
    .upsert(payload, { onConflict: 'chat_id,item_type,item_id' })
}

async function fetchContextSummaries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  contextItems?: ContextItemInput[]
) {
  const contexts: Array<{
    id: string
    type: string
    title: string
    body: string
  }> = []

  const noteIds =
    contextItems?.filter((item) => item.type === 'note').map((item) => item.id) ?? []
  const folderIds =
    contextItems?.filter((item) => item.type === 'folder').map((item) => item.id) ?? []
  const fileIds =
    contextItems?.filter((item) => item.type === 'file').map((item) => item.id) ?? []

  if (noteIds.length) {
    const { data } = await supabase
      .from('notes')
      .select('id,title,content')
      .eq('user_id', userId)
      .in('id', noteIds)
    data?.forEach((note) => {
      contexts.push({
        id: note.id,
        type: 'note',
        title: `Note: ${note.title}`,
        body: note.content ?? '',
      })
    })
  }

  if (folderIds.length) {
    const { data: folders } = await supabase
      .from('folders')
      .select('id,name')
      .eq('user_id', userId)
      .in('id', folderIds)
    if (folders?.length) {
      const { data: folderNotes } = await supabase
        .from('notes')
        .select('id,title,content,folder_id')
        .eq('user_id', userId)
        .in(
          'folder_id',
          folders.map((folder) => folder.id)
        )
      folders.forEach((folder) => {
        const folderNoteBodies =
          folderNotes
            ?.filter((note) => note.folder_id === folder.id)
            .map((note) => `- ${note.title}\n${note.content ?? ''}`)
            .join('\n\n') ?? ''
        contexts.push({
          id: folder.id,
          type: 'folder',
          title: `Folder: ${folder.name}`,
          body: folderNoteBodies,
        })
      })
    }
  }

  if (fileIds.length) {
    const { data } = await supabase
      .from('files')
      .select('id,name,metadata')
      .eq('user_id', userId)
      .in('id', fileIds)
    data?.forEach((file) => {
      const description = file.metadata?.description || ''
      contexts.push({
        id: file.id,
        type: 'file',
        title: `File: ${file.name}`,
        body: `Metadata: ${JSON.stringify(file.metadata ?? {}, null, 2)}\n${description}`,
      })
    })
  }

  // Fallback context: include recent notes if user did not pass anything
  if (!contexts.length) {
    const { data: recentNotes } = await supabase
      .from('notes')
      .select('id,title,content')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(5)
    recentNotes?.forEach((note) => {
      contexts.push({
        id: note.id,
        type: 'note',
        title: `Note: ${note.title}`,
        body: note.content ?? '',
      })
    })
  }

  return contexts
}

async function fetchChatHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  chatId: string,
  userId: string
) {
  const { data: messagesData } = await supabase
    .from('ai_messages')
    .select('id,role,content,context_items')
    .eq('chat_id', chatId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  return messagesData ?? []
}

function buildPrompt({
  contexts,
  history,
  message,
}: {
  contexts: Awaited<ReturnType<typeof fetchContextSummaries>>
  history: Awaited<ReturnType<typeof fetchChatHistory>>
  message: string
}) {
  const contextText = (contexts ?? [])
    .map(
      (ctx) => `### ${ctx.title}
${ctx.body}`
    )
    .join('\n\n')

  const historyText = history
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n\n')

  return `You are Cortex AI, a helpful assistant for knowledge workspaces.
You must rely on the provided CONTEXT. If the answer cannot be found, ask clarifying questions or state that it is not available.

CONTEXT:
${contextText || 'No explicit context provided. Use available knowledge.'}

CONVERSATION HISTORY:
${historyText || 'No previous conversation.'}

USER QUESTION:
${message}
`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = (await req.json()) as ChatRequestPayload
    if (!payload?.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    let chatId = payload.chatId

    if (!chatId || payload.reset) {
      const title = payload.title || payload.message.slice(0, 60)
      const { data: newChat, error: chatError } = await supabase
        .from('ai_chats')
        .insert({
          user_id: user.id,
          title,
        })
        .select('id')
        .single()
      if (chatError || !newChat) {
        return NextResponse.json({ error: chatError?.message ?? 'Failed to create chat' }, { status: 500 })
      }
      chatId = newChat.id
    } else {
      const { data: existingChat } = await supabase
        .from('ai_chats')
        .select('id')
        .eq('id', chatId)
        .eq('user_id', user.id)
        .single()
      if (!existingChat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
    }

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    await upsertChatContext(supabase, chatId, user.id, payload.contextItems ?? [])

    const contexts = await fetchContextSummaries(supabase, user.id, payload.contextItems ?? [])
    const history = await fetchChatHistory(supabase, chatId, user.id)

    // Save user message
    await supabase.from('ai_messages').insert({
      chat_id: chatId,
      user_id: user.id,
      role: 'user',
      content: payload.message,
      context_items: payload.contextItems ?? [],
    })

    const model = geminiClient.getGenerativeModel({ model: MODEL_ID })
    const prompt = buildPrompt({ contexts, history, message: payload.message })
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Save assistant response
    await supabase.from('ai_messages').insert({
      chat_id: chatId,
      user_id: user.id,
      role: 'assistant',
      content: text,
      context_items: payload.contextItems ?? [],
    })

    return NextResponse.json({
      chatId,
      reply: text,
      context: contexts,
    })
  } catch (error) {
    console.error('[AI_CHAT_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}


