import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

type Listener = () => void

const listeners = new Set<Listener>()
let mediaQuery: MediaQueryList | undefined

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

function subscribe(onStoreChange: Listener) {
  if (!mediaQuery) {
    mediaQuery = window.matchMedia(MOBILE_QUERY)
    mediaQuery.addEventListener("change", notify)
  }

  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    if (listeners.size === 0 && mediaQuery) {
      mediaQuery.removeEventListener("change", notify)
      mediaQuery = undefined
    }
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
