// No error tracking with user context
export async function initializeSentry() {
  // No initialization - no tracking
}

export function captureException(error: any, _context?: any) {
  // Simple console logging without user data
  // eslint-disable-next-line no-console
  console.error('Error occurred:', error);
}

export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  _context?: any
) {
  // Simple console logging
  // eslint-disable-next-line no-console
  console.log(`[${level}]: ${message}`);
}

export function setUserContext(_user: any) {
  // No user context tracking
}

export function clearUserContext() {
  // No user context to clear
}

export function addBreadcrumb(
  _message: string,
  _category?: string,
  _level?: string,
  _data?: any
) {
  // No breadcrumb tracking
}

export function startTransaction(_name: string, _op?: string) {
  // No transaction tracking
  return null;
}
