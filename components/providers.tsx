"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  )

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    let isReload = false

    if (typeof performance.getEntriesByType === "function") {
      const navigationEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
      const navigation = navigationEntries[0]
      isReload = navigation?.type === "reload"
    } else if ("navigation" in performance) {
      // @ts-expect-error - legacy API
      isReload = performance.navigation.type === 1
    }

    if (isReload) return

    const resetSession = async () => {
      try {
        const response = await fetch("/api/dev/reset-session", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        })

        if (!response.ok) {
          throw new Error(`Failed to reset session: ${response.status}`)
        }
      } catch (error) {
        console.error("[DEV_SESSION_RESET_ERROR]", error)
      }
    }

    resetSession()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

