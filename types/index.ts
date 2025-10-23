// User & Profile Types
export interface User {
  id: string
  email: string
  created_at?: string
  updated_at?: string
}

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  full_name?: string
  avatar_url?: string
  created_at?: string
  updated_at?: string
}

// Note Types
export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

// File Types
export interface File {
  id: string
  user_id: string
  name: string
  type: string
  size: number
  url: string
  metadata?: Record<string, unknown>
  created_at: string
}

// Reminder Types
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

// Chat Message Types
export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
