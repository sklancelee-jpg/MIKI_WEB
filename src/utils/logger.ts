// Structured JSON error logger
// All errors in MIKI must use this logger — never raw console.log

export interface MikiError {
  error_code: string
  description: string
  context_payload: Record<string, unknown>
}

export function logError(error: MikiError): void {
  const entry = {
    ...error,
    timestamp: Date.now(),
    level: 'error',
  }
  console.error(JSON.stringify(entry))
}

export function logWarn(error: Omit<MikiError, 'error_code'> & { error_code?: string }): void {
  const entry = {
    error_code: 'WARN',
    ...error,
    timestamp: Date.now(),
    level: 'warn',
  }
  console.warn(JSON.stringify(entry))
}

export function logInfo(message: string, payload?: Record<string, unknown>): void {
  const entry = {
    message,
    payload: payload ?? {},
    timestamp: Date.now(),
    level: 'info',
  }
  console.info(JSON.stringify(entry))
}
