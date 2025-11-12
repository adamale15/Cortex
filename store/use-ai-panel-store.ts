import { create } from 'zustand'

interface AIPanelState {
  isOpen: boolean
  activeChatId: string | null
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setActiveChat: (chatId: string | null) => void
}

export const useAIPanelStore = create<AIPanelState>((set) => ({
  isOpen: false,
  activeChatId: null,
  openPanel: () => set({ isOpen: true }),
  closePanel: () => set({ isOpen: false }),
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
}))

