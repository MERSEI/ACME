export type ApiErrorCode = 'NOT_FOUND' | 'DUPLICATE_NAME' | 'VALIDATION' | 'STORAGE'

/** Error shape the mock "server" throws — mirrors what a real API would return. */
export class ApiError extends Error {
  code: ApiErrorCode

  constructor(code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return 'Browser storage is full. Delete some files and try again.'
  }
  return 'Something went wrong. Please try again.'
}
