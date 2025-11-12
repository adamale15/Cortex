import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RESULT_LIMIT = 8

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() ?? ''

    const [notesRes, foldersRes, filesRes] = await Promise.all([
      supabase
        .from('notes')
        .select('id,title,content')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(RESULT_LIMIT),
      supabase
        .from('folders')
        .select('id,name')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(RESULT_LIMIT),
      supabase
        .from('files')
        .select('id,name,type,metadata')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(RESULT_LIMIT),
    ])

    const items: Array<{
      id: string
      type: 'note' | 'folder' | 'file'
      title: string
      subtitle?: string
    }> = []

    notesRes.data?.forEach((note) => {
      items.push({
        id: note.id,
        type: 'note',
        title: note.title,
        subtitle:
          note.content?.replace(/\s+/g, ' ').slice(0, 120) ||
          'Note content unavailable',
      })
    })

    foldersRes.data?.forEach((folder) => {
      items.push({
        id: folder.id,
        type: 'folder',
        title: folder.name,
        subtitle: 'Folder',
      })
    })

    filesRes.data?.forEach((file) => {
      items.push({
        id: file.id,
        type: 'file',
        title: file.name,
        subtitle: file.type,
      })
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[AI_CONTEXT_SEARCH_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI context options' },
      { status: 500 }
    )
  }
}


