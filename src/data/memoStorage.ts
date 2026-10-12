// メモの保存先。MemoPage と HistoryPage で共有する。
// 日付 "YYYY-MM-DD" → その日のメモ本文(1日1件)
export type MemoMap = Record<string, string>

export const MEMO_EVENT = 'darts-memo-change'

const KEY = 'darts-memos'

export function loadMemos(): MemoMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    // 旧形式(配列・新しい順)からの移行: 同じ日付は新しい方を採用
    if (Array.isArray(parsed)) {
      const map: MemoMap = {}
      for (const item of parsed as { date?: string; text?: string }[]) {
        if (item?.date && item.text && !(item.date in map)) map[item.date] = item.text
      }
      return map
    }
    return (parsed && typeof parsed === 'object' ? parsed : {}) as MemoMap
  } catch {
    return {}
  }
}

export function saveMemos(memos: MemoMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(memos))
  } catch {
    /* 保存できない環境では何もしない */
  }
  window.dispatchEvent(new Event(MEMO_EVENT))
}
