import { useState, type FormEvent } from 'react'

const STARTS = [301, 501, 701] as const

type Turn = { score: number; bust: boolean; remainingAfter: number }

export default function ZeroOnePage() {
  const [start, setStart] = useState<number>(701)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')

  const remaining = turns.length ? turns[turns.length - 1].remainingAfter : start
  const finished = remaining === 0
  const scored = turns.filter((t) => !t.bust).reduce((sum, t) => sum + t.score, 0)
  const ppr = turns.length ? (scored / turns.length).toFixed(1) : '-'

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (finished) return
    const score = Number(input)
    if (!Number.isInteger(score) || score < 0 || score > 180) return
    const next = remaining - score
    // 0未満はバスト。1も(ダブルアウト想定で)バスト扱い
    const bust = next < 0 || next === 1
    setTurns([...turns, { score, bust, remainingAfter: bust ? remaining : next }])
    setInput('')
  }

  const undo = () => setTurns(turns.slice(0, -1))
  const reset = (nextStart = start) => {
    setStart(nextStart)
    setTurns([])
    setInput('')
  }

  return (
    <div className="page-shell">
      <section className="practice-panel">
        <div className="form-trio">
          {STARTS.map((s) => (
            <button
              key={s}
              type="button"
              className={`button ${start === s ? 'button-primary' : ''}`}
              onClick={() => reset(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="daily-summary" style={{ marginTop: 16 }}>
          <div className="daily-summary-item"><span>残り</span><strong>{remaining}</strong></div>
          <div className="daily-summary-item"><span>ラウンド</span><strong>{turns.length}</strong></div>
          <div className="daily-summary-item"><span>PPR</span><strong>{ppr}</strong></div>
        </div>

        {finished ? (
          <p style={{ marginTop: 16 }}>
            <strong>FINISH!</strong> {turns.length}ラウンドで上がりました。
          </p>
        ) : (
          <form className="practice-form" onSubmit={onSubmit} style={{ marginTop: 16 }}>
            <label>
              このラウンドの得点 (0〜180)
              <input
                type="number"
                min="0"
                max="180"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                required
              />
            </label>
            <button className="button button-primary full-button" type="submit">
              入力 <span aria-hidden="true">↗</span>
            </button>
          </form>
        )}

        <div className="form-pair" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={undo} disabled={turns.length === 0}>
            1つ戻す
          </button>
          <button className="button" type="button" onClick={() => reset()}>
            リセット
          </button>
        </div>
      </section>

      <section aria-label="ラウンド履歴" style={{ marginTop: 24 }}>
        <table style={{ width: '100%', textAlign: 'center' }}>
          <thead>
            <tr><th>R</th><th>得点</th><th>残り</th></tr>
          </thead>
          <tbody>
            {turns.map((t, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{t.bust ? 'BUST' : t.score}</td>
                <td>{t.remainingAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
