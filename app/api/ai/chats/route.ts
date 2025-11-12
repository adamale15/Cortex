import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const offset = Number(req.nextUrl.searchParams.get('offset') ?? '0')
    const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '3'), 10)

    const { data, error } = await supabase
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
        ),
        ai_messages(count)
      `
      )
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const chats = (data ?? [])
      .map((chat) => {
        const messageCount =
          Array.isArray((chat as any).ai_messages) && (chat as any).ai_messages.length
            ? Number((chat as any).ai_messages[0]?.count ?? 0)
            : 0

        if (messageCount === 0) {
          return null
        }

        return {
          id: chat.id,
          title: chat.title,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          contextItems:
            chat.ai_chat_contexts?.map((ctx) => ({
              id: ctx.item_id,
              type: ctx.item_type,
            })) ?? [],
          messageCount,
        }
      })
      .filter(
        (chat): chat is typeof chat & { messageCount: number } => chat !== null
      )

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('[AI_CHATS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch AI chats' }, { status: 500 })
  }
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

    const { title } = (await req.json()) as { title?: string } | null

    const { data, error } = await supabase
      .from('ai_chats')
      .insert({
        user_id: user.id,
        title: title || 'New chat',
      })
      .select('id,title,created_at,updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create chat' }, { status: 500 })
    }

    return NextResponse.json({
      chat: {
        id: data.id,
        title: data.title,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        contextItems: [],
      },
    })
  } catch (error) {
    console.error('[AI_CHATS_POST_ERROR]', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}


