/**
 * 生成唯一 ID。
 * 优先使用浏览器原生 `crypto.randomUUID`，不含连字符前缀额外处理，
 * 失败时回退到基于时间戳 + 随机数的方案。
 */
export function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}