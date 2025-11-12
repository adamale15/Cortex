'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageCircle, Plus, Sparkles, X, History, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIPanelStore } from '@/store/use-ai-panel-store'
import { cn } from '@/lib/utils'

type ContextItem = {
  id: string
  type: 'note' | 'folder' | 'file'
}

type ChatPreview = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  contextItems: ContextItem[]
  messageCount?: number
}

type ChatDetail = {
  chat: ChatPreview
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    createdAt: string
    contextItems: ContextItem[]
  }>
}

export const AI_PANEL_WIDTH = 420

type ContextSuggestion = ContextItem & {
  title: string
  subtitle?: string
}

const CHAT_PAGE_SIZE = 3

async function fetchChats(
  params: { offset?: number; limit?: number } = {}
): Promise<ChatPreview[]> {
  const { offset = 0, limit = CHAT_PAGE_SIZE } = params
  const search = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  })
  const res = await fetch(`/api/ai/chats?${search.toString()}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to load AI chats')
  }
  const json = await res.json()
  return json.chats ?? []
}

async function createChat(): Promise<ChatPreview> {
  const res = await fetch('/api/ai/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    throw new Error('Failed to create chat')
  }
  const json = await res.json()
  return json.chat
}

async function fetchChatDetail(chatId: string): Promise<ChatDetail> {
  const res = await fetch(`/api/ai/chats/${chatId}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch chat detail')
  }
  return res.json()
}

async function sendChatMessage(params: {
  chatId?: string
  message: string
  contextItems?: ContextItem[]
  title?: string
}) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to send message')
  }
  return res.json()
}

async function fetchContextSuggestions(query: string): Promise<ContextSuggestion[]> {
  const search = new URLSearchParams()
  if (query) search.set('q', query)
  const res = await fetch(`/api/ai/context?${search.toString()}`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch context suggestions')
  }
  const json = await res.json()
  return json.items ?? []
}

async function addContextItem(params: {
  chatId: string
  itemId: string
  type: ContextItem['type']
}) {
  const res = await fetch(`/api/ai/chats/${params.chatId}/context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: params.itemId, type: params.type }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to add context')
  }
  return res.json()
}

async function removeContextItem(params: {
  chatId: string
  itemId: string
  type: ContextItem['type']
}) {
  const res = await fetch(
    `/api/ai/chats/${params.chatId}/context?itemId=${params.itemId}&type=${params.type}`,
    { method: 'DELETE' }
  )
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to remove context')
  }
  return res.json()
}

async function deleteChat(chatId: string) {
  const res = await fetch(`/api/ai/chats/${chatId}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Failed to delete chat')
  }
  return res.json()
}

export function AIPanel() {
  const queryClient = useQueryClient()
  const { isOpen, closePanel, activeChatId, setActiveChat } = useAIPanelStore(
    (state) => ({
      isOpen: state.isOpen,
      closePanel: state.closePanel,
      activeChatId: state.activeChatId,
      setActiveChat: state.setActiveChat,
    })
  )

  const [chatOffset, setChatOffset] = useState(0)
  const [chatList, setChatList] = useState<ChatPreview[]>([])
  const [hasMoreChats, setHasMoreChats] = useState(false)
  const [message, setMessage] = useState('')
  const [contextPickerOpen, setContextPickerOpen] = useState(false)
  const [contextQuery, setContextQuery] = useState('')
  const [mentionQuery, setMentionQuery] = useState('')
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false)
  const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(
    null
  )
  const inputRef = useRef<HTMLInputElement | null>(null)

  const {
    data: fetchedChats = [],
    isLoading: chatsLoading,
    isFetching: chatsFetching,
  } = useQuery({
    queryKey: ['ai-chats', chatOffset],
    queryFn: () => fetchChats({ offset: chatOffset, limit: CHAT_PAGE_SIZE }),
    enabled: isOpen,
    keepPreviousData: true,
    onSuccess: (results) => {
      setHasMoreChats(results.length === CHAT_PAGE_SIZE)
    },
  })

  const isInitialLoading = chatsLoading && chatList.length === 0

  const { data: chatDetail, isLoading: chatLoading } = useQuery({
    queryKey: ['ai-chat', activeChatId],
    queryFn: () => fetchChatDetail(activeChatId!),
    enabled: isOpen && !!activeChatId,
  })

  useEffect(() => {
    if (!isOpen) return
    if (chatsLoading || chatsFetching) return

    setChatList((prev) => {
      if (chatOffset === 0) {
        return fetchedChats
      }

      const existingIds = new Set(prev.map((chat) => chat.id))
      const merged = [...prev]
      fetchedChats.forEach((chat) => {
        if (!existingIds.has(chat.id)) {
          merged.push(chat)
        }
      })
      return merged
    })
  }, [fetchedChats, chatOffset, chatsLoading, chatsFetching, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setChatOffset(0)
      setChatList([])
      setHasMoreChats(false)
      setIsMentionMenuOpen(false)
      setMentionQuery('')
      setMentionRange(null)
    }
  }, [isOpen])

  const {
    mutate: triggerCreateChat,
    isPending: isCreatingChat,
  } = useMutation({
    mutationFn: createChat,
    onSuccess: (chat) => {
      setChatOffset(0)
      setActiveChat(chat.id)
      queryClient.invalidateQueries({ queryKey: ['ai-chats'] })
    },
  })

  const {
    mutate: triggerSendMessage,
    isPending: isSendingMessage,
  } = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['ai-chat', data.chatId] })
      queryClient.invalidateQueries({ queryKey: ['ai-chats'] })
      setActiveChat(data.chatId)
    },
  })

  // Ensure we always have an active chat when panel opens
  useEffect(() => {
    if (!isOpen || chatsLoading) return
    if (!activeChatId && chatList.length) {
      setActiveChat(chatList[0].id)
    }
  }, [isOpen, chatsLoading, chatList, activeChatId, setActiveChat])

  const activeContextItems = useMemo<ContextItem[]>(() => {
    if (chatDetail?.chat?.contextItems?.length) {
      return chatDetail.chat.contextItems
    }
    return []
  }, [chatDetail])

  const { data: contextSuggestions = [], isLoading: contextLoading } = useQuery({
    queryKey: ['ai-context', contextQuery],
    queryFn: () => fetchContextSuggestions(contextQuery),
    enabled: contextPickerOpen,
  })

const { data: mentionSuggestions = [], isLoading: mentionLoading } = useQuery({
  queryKey: ['ai-mention', mentionQuery],
  queryFn: () => fetchContextSuggestions(mentionQuery),
  enabled: isMentionMenuOpen && !!activeChatId,
})

  const { mutate: triggerAddContext, isPending: isAddingContext } = useMutation({
    mutationFn: addContextItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat', activeChatId] })
      queryClient.invalidateQueries({ queryKey: ['ai-chats'] })
      setContextPickerOpen(false)
      setIsMentionMenuOpen(false)
    },
  })

  const { mutate: triggerRemoveContext, isPending: isRemovingContext } = useMutation({
    mutationFn: removeContextItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat', activeChatId] })
      queryClient.invalidateQueries({ queryKey: ['ai-chats'] })
    },
  })

  const { mutate: triggerDeleteChat, isPending: isDeletingChat } = useMutation({
    mutationFn: deleteChat,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['ai-chats'] })
      if (activeChatId === chatId) {
        setActiveChat(null)
      }
    },
  })

  const handleMentionDetection = (value: string, cursor: number | null) => {
    if (cursor === null) {
      setIsMentionMenuOpen(false)
      setMentionQuery('')
      setMentionRange(null)
      return
    }

    const uptoCursor = value.slice(0, cursor)
    const match = uptoCursor.match(/@([\w\s-]*)$/)
    if (match) {
      const query = match[1] ?? ''
      setMentionQuery(query.trim())
      setMentionRange({ start: cursor - match[0].length, end: cursor })
      setIsMentionMenuOpen(true)
    } else if (isMentionMenuOpen) {
      setIsMentionMenuOpen(false)
      setMentionQuery('')
      setMentionRange(null)
    }
  }

  const handleMessageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, selectionStart } = event.target
    setMessage(value)
    handleMentionDetection(value, selectionStart)
  }

  const handleMentionSelect = (item: ContextSuggestion) => {
    if (!activeChatId || !mentionRange) return

    triggerAddContext({
      chatId: activeChatId,
      itemId: item.id,
      type: item.type,
    })

    const before = message.slice(0, mentionRange.start)
    const after = message.slice(mentionRange.end)
    const insertion = `@${item.title}`
    const spacer = after.startsWith(' ') || after.length === 0 ? '' : ' '
    const nextMessage = `${before}${insertion}${spacer}${after}`
    setMessage(nextMessage)
    setIsMentionMenuOpen(false)
    setMentionQuery('')
    setMentionRange(null)

    requestAnimationFrame(() => {
      const input = inputRef.current
      if (input) {
        const newCursor = before.length + insertion.length + spacer.length
        input.setSelectionRange(newCursor, newCursor)
        input.focus()
      }
    })
  }

  const refreshMentionFromInput = () => {
    const input = inputRef.current
    if (!input) return
    handleMentionDetection(input.value, input.selectionStart)
  }

  const handleSendMessage = () => {
    if (!activeChatId || !message.trim() || isSendingMessage) return

    triggerSendMessage({
      chatId: activeChatId ?? undefined,
      message,
      contextItems: activeContextItems,
    })
    setIsMentionMenuOpen(false)
    setMentionQuery('')
    setMentionRange(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[85] w-full max-w-[420px] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-l border-white/5 shadow-[0_0_40px_rgba(15,23,42,0.4)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div className="flex h-full flex-col">
              <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.35)] ring-1 ring-white/20">
                    <Sparkles className="h-6 w-6 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.55)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Cortex AI</h2>
                    <p className="text-xs text-zinc-400">
                      Bring context-aware intelligence into your workspace.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => triggerCreateChat()}
                    className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                    disabled={isCreatingChat}
                  >
                    {isCreatingChat ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'New chat'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={closePanel}
                    variant="ghost"
                    className="h-10 w-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </header>

              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-6 py-5 space-y-6">
                  <section className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Active conversations
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Switch between your previous Cortex interactions.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {isInitialLoading ? (
                        <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-zinc-400 text-sm">
                          Loading conversations…
                        </div>
                      ) : chatList.length ? (
                        <>
                          {chatList.map((chat) => (
                            <div
                              key={chat.id}
                              className={cn(
                                'group relative flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3 transition-colors',
                                chat.id === activeChatId
                                  ? 'bg-white/10 text-white'
                                  : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                              )}
                            >
                              <button
                                onClick={() => setActiveChat(chat.id)}
                                className="flex-1 text-left"
                              >
                                <p className="text-sm font-medium truncate">
                                  {chat.title}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  {chat.contextItems.length
                                    ? `${chat.contextItems.length} context ${
                                        chat.contextItems.length === 1 ? 'item' : 'items'
                                      }`
                                    : 'No context yet'}
                                </p>
                              </button>
                              <button
                                onClick={() => triggerDeleteChat(chat.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400"
                                disabled={isDeletingChat}
                                title="Delete chat"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          {hasMoreChats && (
                            <button
                              onClick={() => setChatOffset((prev) => prev + CHAT_PAGE_SIZE)}
                              className="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-100 px-4 py-3 text-sm flex items-center justify-center gap-2 transition-colors hover:bg-indigo-500/20"
                              disabled={chatsFetching}
                            >
                              <History className="h-4 w-4" />
                              {chatsFetching ? 'Loading…' : 'Show older conversations'}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-zinc-400 text-sm">
                          Start by creating a new chat.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          Context builder
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Mention with <span className="text-white">@</span> or use the
                          add button to attach notes, folders or files.
                        </p>
                      </div>
                      <Button
                        type="button"
                        className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                        onClick={() => {
                          if (!activeChatId && !isCreatingChat) {
                            triggerCreateChat()
                          }
                          setContextPickerOpen(true)
                        }}
                        disabled={!activeChatId && isCreatingChat}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {activeContextItems.length ? 'Edit context' : 'Add context'}
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-zinc-950/80 p-4 space-y-3">
                      {activeContextItems.length ? (
                        <div className="flex flex-wrap gap-2">
                          {activeContextItems.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white capitalize"
                            >
                              {item.type}: {item.id.slice(0, 8)}…
                              <button
                                type="button"
                                onClick={() =>
                                  triggerRemoveContext({
                                    chatId: activeChatId!,
                                    itemId: item.id,
                                    type: item.type,
                                  })
                                }
                                className="text-zinc-400 hover:text-white transition"
                                disabled={isRemovingContext}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          No context selected yet. Attach notes, folders or files to give
                          Cortex something to reason about.
                        </p>
                      )}
                      <div className="rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-zinc-400">
                        Type <span className="text-white font-medium">@</span> in your
                        message below to bring up quick suggestions from your workspace.
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Chat</h3>
                        <p className="text-xs text-zinc-500">
                          Ask a question and Cortex will synthesize answers from your
                          context.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-zinc-950/70 min-h-[220px] flex flex-col">
                      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto">
                        {chatLoading ? (
                          <div className="text-zinc-500 text-sm text-center">
                            Loading conversation…
                          </div>
                        ) : chatDetail?.messages?.length ? (
                          chatDetail.messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                'rounded-2xl px-4 py-3 max-w-[85%]',
                                msg.role === 'assistant'
                                  ? 'bg-white/5 text-white'
                                  : msg.role === 'user'
                                  ? 'ml-auto bg-indigo-500/20 text-indigo-100 border border-indigo-400/40'
                                  : 'bg-zinc-800/60 text-zinc-200'
                              )}
                            >
                              <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">
                                {msg.role}
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-zinc-500 text-sm text-center">
                            No messages yet. Start the conversation below.
                          </div>
                        )}

                        {isSendingMessage && (
                          <div className="text-zinc-400 text-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cortex is thinking…
                          </div>
                        )}
                      </div>
                      <div className="border-t border-white/5 p-4">
                        <div className="relative rounded-full bg-black/60 border border-white/10 px-3 py-2 flex items-center gap-3">
                          {isMentionMenuOpen && activeChatId && (
                            <div className="absolute bottom-full left-0 right-0 mb-3 rounded-2xl border border-white/10 bg-zinc-950/95 shadow-[0_15px_40px_rgba(15,23,42,0.6)] backdrop-blur-md overflow-hidden">
                              <div className="py-2">
                                {mentionLoading ? (
                                  <div className="px-4 py-3 text-sm text-zinc-500 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching…
                                  </div>
                                ) : mentionSuggestions.length ? (
                                  mentionSuggestions.map((item) => {
                                    const alreadySelected = activeContextItems.some(
                                      (ctx) => ctx.id === item.id && ctx.type === item.type
                                    )
                                    return (
                                      <button
                                        key={`mention-${item.type}-${item.id}`}
                                        type="button"
                                        disabled={alreadySelected || isAddingContext}
                                        onClick={() => handleMentionSelect(item)}
                                        className={cn(
                                          'w-full px-4 py-2 text-left text-sm flex flex-col gap-1 transition-colors',
                                          alreadySelected
                                            ? 'bg-emerald-500/10 text-emerald-200'
                                            : 'text-white hover:bg-white/10'
                                        )}
                                      >
                                        <span className="font-medium capitalize">
                                          {item.type}: {item.title}
                                        </span>
                                        {item.subtitle && (
                                          <span className="text-xs text-zinc-400">
                                            {item.subtitle}
                                          </span>
                                        )}
                                      </button>
                                    )
                                  })
                                ) : (
                                  <div className="px-4 py-3 text-sm text-zinc-500">
                                    No matches found.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <MessageCircle className="h-4 w-4 text-zinc-500" />
                          <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={handleMessageChange}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault()
                                handleSendMessage()
                              } else if (event.key === 'Escape' && isMentionMenuOpen) {
                                event.preventDefault()
                                setIsMentionMenuOpen(false)
                                setMentionQuery('')
                                setMentionRange(null)
                              }
                            }}
                            onKeyUp={refreshMentionFromInput}
                            onClick={refreshMentionFromInput}
                            placeholder="Ask Cortex anything about your workspace…"
                            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                            disabled={!activeChatId || isSendingMessage}
                          />
                          <Button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!message.trim() || isSendingMessage || !activeChatId}
                            className="rounded-full bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400"
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </motion.aside>

          <AnimatePresence>
            {contextPickerOpen && (
              <motion.div
                className="fixed inset-0 z-[95] flex items-center justify-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 bg-black/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setContextPickerOpen(false)}
                />
                <motion.div
                  className="relative z-[96] w-full max-w-xl rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 shadow-[0_25px_80px_rgba(15,23,42,0.55)] p-6 space-y-6"
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Add context
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Select relevant notes, folders or files to ground Cortex’s answers.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="h-9 w-9 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
                      onClick={() => setContextPickerOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 flex items-center gap-3">
                    <input
                      type="text"
                      value={contextQuery}
                      onChange={(event) => setContextQuery(event.target.value)}
                      placeholder="Search notes, folders or files…"
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-[320px] overflow-y-auto space-y-3">
                    {contextLoading ? (
                      <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching context…
                      </div>
                    ) : contextSuggestions.length ? (
                      contextSuggestions.map((item) => {
                        const alreadySelected = activeContextItems.some(
                          (ctx) => ctx.id === item.id && ctx.type === item.type
                        )

                        return (
                          <button
                            key={`${item.type}-${item.id}`}
                            disabled={alreadySelected || isAddingContext || !activeChatId}
                            onClick={() =>
                              triggerAddContext({
                                chatId: activeChatId!,
                                itemId: item.id,
                                type: item.type,
                              })
                            }
                            className={cn(
                              'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                              alreadySelected
                                ? 'border-emerald-600/40 bg-emerald-500/10 text-emerald-200'
                                : 'border-white/5 bg-white/5 text-zinc-200 hover:bg-white/10'
                            )}
                          >
                            <div className="text-sm font-medium capitalize text-white">
                              {item.type}: {item.title}
                            </div>
                            {item.subtitle && (
                              <div className="text-xs text-zinc-400 mt-1">
                                {item.subtitle}
                              </div>
                            )}
                          </button>
                        )
                      })
                    ) : (
                      <div className="text-sm text-zinc-500 text-center py-10">
                        No matches found. Try a different search term.
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}


