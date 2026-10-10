export type GameType = 'practice' | '10mark' | 'hitRate' | 'inBullRate' | 'arrange'
export type RecordValue = string | number | boolean | null

export type SessionRecord = {
  id: string
  type: GameType
  date: string
  [key: string]: RecordValue
}

export type RecordInput = {
  type: GameType
  date: string
  [key: string]: RecordValue
}

export const STORAGE_KEY = 'darts-practice-records-v1'
export const STORAGE_EVENT = 'darts-records-changed'

export function todayString() {
  const date = new Date()
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function getDailySummary(records: SessionRecord[], date: string) {
  const dailyRecords = records.filter((record) => record.date === date)
  const duration = dailyRecords.reduce((total, record) => total + Number(record.duration ?? 0), 0)
  const throws = dailyRecords.reduce((total, record) => {
    if (record.type !== 'arrange') return total + Number(record.throws ?? 0)
    return total + ['score1', 'score2', 'score3'].filter((key) => record[key] !== '' && record[key] !== null && record[key] !== undefined).length
  }, 0)
  const hats = dailyRecords.reduce((total, record) => total + Number(record.hat ?? 0), 0)
  return { duration, throws, hats }
}

export function loadRecords(): SessionRecord[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return []
    return value.filter((record): record is SessionRecord =>
      typeof record === 'object' && record !== null &&
      typeof record.id === 'string' && typeof record.type === 'string' &&
      typeof record.date === 'string',
    )
  } catch {
    return []
  }
}

export function saveRecord(record: RecordInput) {
  const records = loadRecords()
  records.unshift({ ...record, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  window.dispatchEvent(new Event(STORAGE_EVENT))
}