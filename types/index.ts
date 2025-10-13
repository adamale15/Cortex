// Global types and interfaces

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface File {
  id: string
  user_id: string
  name: string
  type: string
  size: number
  url: string
  metadata?: Record<string, any>
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  title: string
  description?: string
  due_date: string
  completed: boolean
  created_at: string
  updated_at: string
}

