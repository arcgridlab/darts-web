import { useState, type FormEvent } from 'react'

// 日付 → その日のメモ本文。保存するたびに、その日の既存メモの末尾へ追記される。
type MemoMap = Record<string, string>

const KEY = 'darts-memos'

function today() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function loadMemos(): MemoMap {
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

function saveMemos(memos: MemoMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(memos))
  } catch {
    /* 保存できない環境では何もしない */
  }
}

// 年・月・日の数字から "YYYY-MM-DD" を作る。存在しない日付なら null。
function buildDate(year: string, month: string, day: string): string | null {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null
  if (y < 1000 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const check = new Date(y, m - 1, d)
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return null
  const p = (n: number) => String(n).padStart(2, '0')
  return `${y}-${p(m)}-${p(d)}`
}

export default function MemoPage() {
  const [memos, setMemos] = useState<MemoMap>(loadMemos)
  const [year, setYear] = useState(() => today().slice(0, 4))
  const [month, setMonth] = useState(() => String(Number(today().slice(5, 7))))
  const [day, setDay] = useState(() => String(Number(today().slice(8, 10))))
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [dateError, setDateError] = useState(false)
  // 編集中の日付と、その編集用テキスト
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const update = (next: MemoMap) => {
    setMemos(next)
    saveMemos(next)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const date = buildDate(year, month, day)
    if (!date) {
      setDateError(true)
      return
    }
    setDateError(false)
    const trimmed = text.trim()
    if (!trimmed) return
    const previous = memos[date]
    update({ ...memos, [date]: previous ? `${previous}\n${trimmed}` : trimmed })
    setText('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const startEdit = (target: string) => {
    setEditingDate(target)
    setEditText(memos[target] ?? '')
  }

  const cancelEdit = () => {
    setEditingDate(null)
    setEditText('')
  }

  // 編集内容でその日のメモ全体を置き換える。空にして保存するとその日のメモは削除される。
  const commitEdit = () => {
    if (editingDate === null) return
    const trimmed = editText.trim()
    if (!trimmed && !window.confirm(`${editingDate} のメモを削除しますか?\nこの操作は元に戻せません。`)) return
    const next = { ...memos }
    if (trimmed) next[editingDate] = trimmed
    else delete next[editingDate]
    update(next)
    cancelEdit()
  }

  const remove = (target: string) => {
    if (!window.confirm(`${target} のメモを削除しますか?\nこの操作は元に戻せません。`)) return
    const next = { ...memos }
    delete next[target]
    update(next)
    if (editingDate === target) cancelEdit()
  }

  const dates = Object.keys(memos).sort().reverse()

  return (
    <div className="page-shell">
      <section className="practice-panel">
        <form className="practice-form" onSubmit={onSubmit}>
          <div className="form-trio">
            <label>
              年
              <input type="number" inputMode="numeric" min="1000" max="9999" value={year} onChange={(event) => setYear(event.target.value)} required />
            </label>
            <label>
              月
              <input type="number" inputMode="numeric" min="1" max="12" value={month} onChange={(event) => setMonth(event.target.value)} required />
            </label>
            <label>
              日
              <input type="number" inputMode="numeric" min="1" max="31" value={day} onChange={(event) => setDay(event.target.value)} required />
            </label>
          </div>
          {dateError && <p role="alert">存在しない日付です。年・月・日を確認してください。</p>}
          <label>
            メモ(保存すると、この日のメモの末尾に追記されます)
            <textarea
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="気づき・フォームの意識ポイントなど"
              style={{ width: '100%' }}
            />
          </label>
          <button className="button button-primary full-button" type="submit">
            {saved ? '保存しました' : 'メモを保存'} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>

      <section aria-label="メモ一覧" style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        {dates.length === 0 && <p>メモはまだありません。</p>}
        {dates.map((d) => (
          <article key={d} className="practice-panel">
            <div className="panel-title-row">
              <p className="eyebrow">{d}{d === today() ? '(今日)' : ''}</p>
              <div>
                {editingDate === d ? (
                  <>
                    <button className="button button-primary" type="button" onClick={commitEdit}>保存</button>{' '}
                    <button className="button" type="button" onClick={cancelEdit}>キャンセル</button>
                  </>
                ) : (
                  <>
                    <button className="button" type="button" onClick={() => startEdit(d)}>編集</button>{' '}
                    <button className="button" type="button" onClick={() => remove(d)}>削除</button>
                  </>
                )}
              </div>
            </div>
            {editingDate === d ? (
              <textarea
                rows={6}
                value={editText}
                onChange={(event) => setEditText(event.target.value)}
                style={{ width: '100%' }}
                autoFocus
              />
            ) : (
              <p style={{ whiteSpace: 'pre-wrap' }}>{memos[d]}</p>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
