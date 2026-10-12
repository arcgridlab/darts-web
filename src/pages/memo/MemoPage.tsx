import { useState, type FormEvent } from 'react'
import { loadMemos, saveMemos, type MemoMap } from '../../data/memoStorage'

// 日付 → その日のメモ本文。保存するたびに、その日の既存メモの末尾へ追記される。

const pad = (n: number) => String(n).padStart(2, '0')

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 年・月・日の数字から "YYYY-MM-DD" を作る。存在しない日付なら null。
function buildDate(year: string, month: string, day: string): string | null {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (!y || !m || !d) return null
  const check = new Date(y, m - 1, d)
  if (check.getFullYear() !== y || check.getMonth() !== m - 1 || check.getDate() !== d) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

function daysInMonth(year: string, month: string) {
  return new Date(Number(year), Number(month), 0).getDate()
}

type DatePartProps = {
  label: string
  unit: string
  width: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

// 文字のように見える1項目。リストから選ぶだけ(枠・▼は表示しない)。
function DatePart({ label, unit, width, value, options, onChange }: DatePartProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width,
          padding: 0,
          border: 'none',
          background: 'transparent',
          boxShadow: 'none',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'center',
          textAlignLast: 'center',
          cursor: 'pointer',
          // ▼ を隠す
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span aria-hidden="true">{unit}</span>
    </span>
  )
}

export default function MemoPage() {
  const [memos, setMemos] = useState<MemoMap>(loadMemos)
  const [year, setYear] = useState(() => today().slice(0, 4))
  const [month, setMonth] = useState(() => String(Number(today().slice(5, 7))))
  const [day, setDay] = useState(() => String(Number(today().slice(8, 10))))
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  // 編集中の日付と、その編集用テキスト
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const thisYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 7 }, (_, i) => String(thisYear + 1 - i))
  const monthOptions = Array.from({ length: 12 }, (_, i) => String(i + 1))
  const dayOptions = Array.from({ length: daysInMonth(year, month) }, (_, i) => String(i + 1))

  const update = (next: MemoMap) => {
    setMemos(next)
    saveMemos(next)
  }

  // 年・月を変えて存在しない日(例: 2月31日)になるときは、その月の末日に合わせる
  const changeYear = (value: string) => {
    setYear(value)
    setDay(String(Math.min(Number(day), daysInMonth(value, month))))
  }
  const changeMonth = (value: string) => {
    setMonth(value)
    setDay(String(Math.min(Number(day), daysInMonth(year, value))))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const date = buildDate(year, month, day)
    if (!date) {
      window.alert('存在しない日付です。年・月・日を確認してください。')
      return
    }
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

  // 一覧に出すのは、いま選んでいる日付のメモだけ
  const selectedDate = buildDate(year, month, day)
  const dates = selectedDate && memos[selectedDate] ? [selectedDate] : []

  return (
    <div className="page-shell">
      <section className="practice-panel">
        <form className="practice-form" onSubmit={onSubmit}>
          <div>
            {/* 枠や背景はなし。文字として「2026年 10月 12日」と並べる */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
              <DatePart label="年" unit="年" width="6ch" value={year} options={yearOptions} onChange={changeYear} />
              <DatePart label="月" unit="月" width="4ch" value={month} options={monthOptions} onChange={changeMonth} />
              <DatePart label="日" unit="日" width="4ch" value={day} options={dayOptions} onChange={setDay} />
              ※左記日付に保存済みメモある場合、次回以降は末尾に追記されます
            </div>
          </div>

            <textarea
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="気づき・フォームの意識ポイントなど"
              style={{ width: '100%' }}
            />
          <button className="button button-primary full-button" type="submit">
            {saved ? '保存しました' : 'メモを保存'} <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>

      <section aria-label="メモ一覧" style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        {dates.length === 0 && <p>この日のメモはまだありません。</p>}
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
