/* Logger utility: centralizes logging; replaces direct console usage. */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

const history: LogEntry[] = []
const MAX_HISTORY = 200

function push(entry: LogEntry) {
  history.push(entry)
  if (history.length > MAX_HISTORY) history.shift()
  // In browser we can still emit to console for now; could be toggled via env.
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`
  if (entry.level === 'error') {
    // eslint-disable-next-line no-console
    console.error(prefix, entry.message, entry.context || '')
  } else if (entry.level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(prefix, entry.message, entry.context || '')
  } else if (entry.level === 'debug') {
    // eslint-disable-next-line no-console
    console.debug(prefix, entry.message, entry.context || '')
  } else {
    // eslint-disable-next-line no-console
    console.log(prefix, entry.message, entry.context || '')
  }
}

export function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  push({ level, message, context, timestamp: new Date().toISOString() })
}

export function info(message: string, context?: Record<string, unknown>) { log('info', message, context) }
export function warn(message: string, context?: Record<string, unknown>) { log('warn', message, context) }
export function error(message: string, context?: Record<string, unknown>) { log('error', message, context) }
export function debug(message: string, context?: Record<string, unknown>) { log('debug', message, context) }

export function getLogHistory(): LogEntry[] {
  return [...history]
}

// Expose for E2E tests
if (typeof window !== 'undefined') {
  ;(window as any).getLogHistory = getLogHistory
}
