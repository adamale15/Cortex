import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params {
  params: { id: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId, type } =
      ((await req.json()) as { itemId?: string; type?: 'note' | 'folder' | 'file' }) ??
      {}

    if (!itemId || !type) {
      return NextResponse.json(
        { error: 'itemId and type are required' },
        { status: 400 }
      )
    }

    const { data: chat } = await supabase
      .from('ai_chats')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const { error } = await supabase.from('ai_chat_contexts').upsert(
      {
        chat_id: params.id,
        user_id: user.id,
        item_type: type,
        item_id: itemId,
      },
      { onConflict: 'chat_id,item_type,item_id' }
    )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI_CHAT_CONTEXT_ADD_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to add context item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const itemId = searchParams.get('itemId')
    const type = searchParams.get('type') as 'note' | 'folder' | 'file' | null

    if (!itemId || !type) {
      return NextResponse.json(
        { error: 'itemId and type are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('ai_chat_contexts')
      .delete()
      .eq('chat_id', params.id)
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .eq('item_type', type)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI_CHAT_CONTEXT_REMOVE_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to remove context item' },
      { status: 500 }
    )
  }
}


