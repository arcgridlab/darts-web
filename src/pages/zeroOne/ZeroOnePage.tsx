import { useEffect, useState, type FormEvent } from 'react'

const STARTS = [301, 501, 701] as const

// 301・501・701 共通のラウンド上限(表示のみ。超えても入力はできる)
const MAX_ROUNDS = 15

// 1投分の入力(ダート1〜3ボタンのポップアップで選ぶ)
type Dart = { label: string; value: number }

const MULTIPLIERS = [
  { times: 1, name: 'シングル', prefix: 'S' },
  { times: 2, name: 'ダブル', prefix: 'D' },
  { times: 3, name: 'トリプル', prefix: 'T' },
] as const

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1)
const DART_COUNT = 3

// ポップアップ内のボタンは、狭い画面でも収まるよう余白と文字を小さめにする
const compact = { flex: 1, minWidth: 0, padding: '8px 4px', fontSize: 14 } as const

type Turn = { score: number; bust: boolean; remainingAfter: number }

// 得点の並びから各ラウンドの結果を計算する。上がり(0)に達したらそこで終わり。
function computeTurns(start: number, scores: number[]): Turn[] {
  const turns: Turn[] = []
  let remaining = start
  for (const score of scores) {
    if (remaining === 0) break
    const next = remaining - score
    // 0未満はバスト。1も(ダブルアウト想定で)バスト扱い
    const bust = next < 0 || next === 1
    if (!bust) remaining = next
    turns.push({ score, bust, remainingAfter: remaining })
  }
  return turns
}

const isValidScore = (score: number) => Number.isInteger(score) && score >= 0 && score <= 180

export default function ZeroOnePage() {
  const [start, setStart] = useState<number>(701)
  const [started, setStarted] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [input, setInput] = useState('')
  // 編集中のラウンド(0始まりの位置)と、その入力値
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  // ダート1〜3の選択結果と、ポップアップの状態
  const [darts, setDarts] = useState<(Dart | null)[]>(() => Array(DART_COUNT).fill(null))
  const [activeDart, setActiveDart] = useState<number | null>(null)
  // ポップアップ内で先に選んだ数字(次にシングル/ダブル/トリプルを選ぶ)
  const [pickedNumber, setPickedNumber] = useState<number | null>(null)

  useEffect(() => {
    if (activeDart === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveDart(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeDart])

  const turns = computeTurns(start, scores)
  const remaining = turns.length ? turns[turns.length - 1].remainingAfter : start
  const finished = started && remaining === 0
  const scored = turns.filter((t) => !t.bust).reduce((sum, t) => sum + t.score, 0)
  const ppr = turns.length ? (scored / turns.length).toFixed(1) : '-'

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const clearDarts = () => setDarts(Array(DART_COUNT).fill(null))

  // 数字を直接入力したときは、ダートの選択を外す
  const onInputChange = (value: string) => {
    setInput(value)
    clearDarts()
  }

  // ポップアップで1投を選ぶ。選んだ投の合計が得点欄に入る。
  const chooseDart = (dart: Dart) => {
    if (activeDart === null) return
    const next = darts.map((d, i) => (i === activeDart ? dart : d))
    setDarts(next)
    setInput(String(next.reduce((sum, d) => sum + (d?.value ?? 0), 0)))
    setActiveDart(null)
    setPickedNumber(null)
  }

  const closeDialog = () => {
    setActiveDart(null)
    setPickedNumber(null)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!started || finished) return
    const score = Number(input)
    if (!isValidScore(score)) return
    setScores([...scores, score])
    setInput('')
    clearDarts()
  }

  const begin = () => {
    setScores([])
    setInput('')
    clearDarts()
    cancelEdit()
    setStarted(true)
  }

  // リセット: 開始前の状態に戻す(点数の選び直しもできる)
  const reset = () => {
    setStarted(false)
    setScores([])
    setInput('')
    clearDarts()
    closeDialog()
    cancelEdit()
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(String(scores[index]))
  }

  const commitEdit = () => {
    if (editingIndex === null) return
    const score = Number(editValue)
    if (editValue.trim() === '' || !isValidScore(score)) {
      window.alert('得点は 0〜180 の整数で入力してください。')
      return
    }
    const nextScores = scores.map((s, i) => (i === editingIndex ? score : s))
    // 修正の結果、途中のラウンドで上がりになる場合は、それ以降のラウンドを削除する
    const kept = computeTurns(start, nextScores).length
    if (kept < nextScores.length) {
      if (!window.confirm('この修正で途中のラウンドで上がりになります。\nそれ以降のラウンドは削除されます。よろしいですか?')) return
    }
    setScores(nextScores.slice(0, kept))
    cancelEdit()
  }

  const removeTurn = (index: number) => {
    if (!window.confirm(`ラウンド ${index + 1} を削除しますか?\nこの操作は元に戻せません。`)) return
    setScores(scores.filter((_, i) => i !== index))
    cancelEdit()
  }

  return (
    <div className="page-shell">
      <section className="practice-panel">
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <select
            className="field-control"
            aria-label="スタート点数"
            value={start}
            onChange={(event) => setStart(Number(event.target.value))}
            disabled={started}
            style={{ width: 120, flex: 'none' }}
          >
            {STARTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="button button-primary" type="button" onClick={begin} disabled={started}>
            開始
          </button>
          <button className="button" type="button" onClick={reset}>
            リセット
          </button>
        </div>

        <div className="daily-summary" style={{ marginTop: 16 }}>
          <div className="daily-summary-item"><strong>{remaining}</strong></div>
          <div className="daily-summary-item"><strong>{turns.length}<small> / {MAX_ROUNDS}</small></strong></div>
          <div className="daily-summary-item"><span>PPR</span><strong>{ppr}</strong></div>
        </div>


        <form
          className="practice-form"
          onSubmit={onSubmit}
          style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {darts.map((dart, i) => (
              <button
                key={i}
                className={`button ${dart ? 'button-primary' : ''}`}
                type="button"
                onClick={() => {
                  setPickedNumber(null)
                  setActiveDart(i)
                }}
                style={{ flex: 1, minWidth: 0 }}
              >
                Dart{i + 1}
                {dart ? `: ${dart.label}` : ''}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <input
              type="number"
              min="0"
              max="180"
              inputMode="numeric"
              aria-label="このラウンドの得点 (0〜180)"
              placeholder="得点 (0〜180)"
              value={input}
              onChange={(event) => onInputChange(event.target.value)}
              required
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="button button-primary" type="submit">
              入力 <span aria-hidden="true">↗</span>
            </button>
          </div>

        </form>

      </section>

      {activeDart !== null && (
        <div
          role="presentation"
          onClick={closeDialog}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Dart${activeDart + 1} を選ぶ`}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              maxHeight: 'calc(100dvh - 16px)',
              overflowY: 'auto',
              padding: 12,
              borderRadius: 12,
              background: 'Canvas',
              color: 'CanvasText',
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Dart{activeDart + 1}</strong>
              <button
                type="button"
                className="button"
                aria-label="閉じる"
                onClick={closeDialog}
                style={{ padding: '4px 10px', fontSize: 14 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="button"
                onClick={() => chooseDart({ label: 'BULL', value: 50 })}
                style={compact}
              >
                BULL (50)
              </button>
              <button
                type="button"
                className="button"
                onClick={() => chooseDart({ label: 'INBULL', value: 50 })}
                style={compact}
              >
                INBULL (50)
              </button>
              <button
                type="button"
                className="button"
                onClick={() => chooseDart({ label: 'MISS', value: 0 })}
                style={compact}
              >
                ミス (0)
              </button>
            </div>

            {/* ① 先に数字を選ぶ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
              {NUMBERS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`button ${pickedNumber === n ? 'button-primary' : ''}`}
                  aria-pressed={pickedNumber === n}
                  onClick={() => setPickedNumber(n)}
                  style={{ padding: '8px 0', fontSize: 14 }}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* ② 数字を選んだあとで、シングル/ダブル/トリプルを選ぶ(選ぶと確定) */}
            <div style={{ display: 'flex', gap: 8 }} role="group" aria-label="シングル・ダブル・トリプル">
              {MULTIPLIERS.map((m) => (
                <button
                  key={m.times}
                  type="button"
                  className="button"
                  disabled={pickedNumber === null}
                  onClick={() =>
                    pickedNumber !== null &&
                    chooseDart({ label: `${m.prefix}${pickedNumber}`, value: pickedNumber * m.times })
                  }
                  style={compact}
                >
                  <span style={{ display: 'block' }}>{m.name}</span>
                  <span style={{ display: 'block', fontSize: 12 }}>
                    {pickedNumber !== null ? pickedNumber * m.times : '-'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <section aria-label="ラウンド履歴" style={{ marginTop: 24 }}>
        <table style={{ width: '100%', textAlign: 'center' }}>
          <thead>
            <tr><th>R</th><th>得点</th><th>残り</th><th>操作</th></tr>
          </thead>
          <tbody>
            {turns.map((t, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  {editingIndex === i ? (
                    <input
                      type="number"
                      min="0"
                      max="180"
                      inputMode="numeric"
                      aria-label={`ラウンド ${i + 1} の得点`}
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      style={{ width: 80 }}
                      autoFocus
                    />
                  ) : t.bust ? 'BUST' : t.score}
                </td>
                <td>{t.remainingAfter}</td>
                <td>
                  {editingIndex === i ? (
                    <>
                      <button className="button button-primary" type="button" onClick={commitEdit}>保存</button>{' '}
                      <button className="button" type="button" onClick={cancelEdit}>キャンセル</button>
                    </>
                  ) : (
                    <>
                      <button className="button" type="button" onClick={() => startEdit(i)}>編集</button>{' '}
                      <button className="button" type="button" onClick={() => removeTurn(i)}>削除</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
