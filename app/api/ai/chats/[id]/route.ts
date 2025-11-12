import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: { id: string }
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: chat, error: chatError } = await supabase
      .from('ai_chats')
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        ai_chat_contexts (
          id,
          item_type,
          item_id
        )
      `
      )
      .eq('user_id', user.id)
      .eq('id', params.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('ai_messages')
      .select('id,role,content,created_at,context_items')
      .eq('chat_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 500 })
    }

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
        contextItems:
          chat.ai_chat_contexts?.map((ctx) => ({
            id: ctx.item_id,
            type: ctx.item_type,
          })) ?? [],
      },
      messages: messages?.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
        contextItems: message.context_items ?? [],
      })) ?? [],
    })
  } catch (error) {
    console.error('[AI_CHAT_DETAIL_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI chat detail' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { title } = (await req.json()) as { title?: string }
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('ai_chats')
      .update({ title })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI_CHAT_UPDATE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    )
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('ai_chats')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI_CHAT_DELETE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    )
  }
}


