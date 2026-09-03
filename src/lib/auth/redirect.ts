export function safeNextPath(value: unknown): string {
  const path = typeof value === 'string' ? value : '/';
  return path.startsWith('/') && !path.startsWith('//') ? path : '/';
}
