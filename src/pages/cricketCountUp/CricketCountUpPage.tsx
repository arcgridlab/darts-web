import { useState } from 'react'

// クリケットカウントアップ: 8ラウンド、各ラウンドのターゲットに対するマーク数(最大9)を入力して合計を競う
const ROUNDS = ['20', '19', '18', '17', '16', '15', 'BULL', 'FREE'] as const
const MAX_MARKS = 9

export default function CricketCountUpPage() {
  const [marks, setMarks] = useState<(number | null)[]>(() => ROUNDS.map(() => null))

  const current = marks.findIndex((m) => m === null)
  const done = current === -1
  const total = marks.reduce<number>((sum, m) => sum + (m ?? 0), 0)
  const played = marks.filter((m) => m !== null).length
  const avg = played ? (total / played).toFixed(2) : '-'

  const input = (value: number) => {
    if (done) return
    setMarks(marks.map((m, i) => (i === current ? value : m)))
  }
  const undo = () => {
    const last = done ? marks.length - 1 : current - 1
    if (last < 0) return
    setMarks(marks.map((m, i) => (i === last ? null : m)))
  }
  const reset = () => setMarks(ROUNDS.map(() => null))

  return (
    <div className="page-shell">

      <section className="practice-panel">
        <div className="daily-summary">
          <div className="daily-summary-item"><span>合計マーク</span><strong>{total}</strong></div>
          <div className="daily-summary-item"><span>ラウンド</span><strong>{played}<small>/{ROUNDS.length}</small></strong></div>
          <div className="daily-summary-item"><span>平均</span><strong>{avg}</strong></div>
        </div>

        {done ? (
          <p style={{ marginTop: 16 }}><strong>終了!</strong> 合計 {total} マークでした。</p>
        ) : (
          <>
            <p style={{ marginTop: 16 }}>
              ROUND {current + 1} / ターゲット: <strong>{ROUNDS[current]}</strong>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {Array.from({ length: MAX_MARKS + 1 }, (_, v) => (
                <button key={v} type="button" className="button" onClick={() => input(v)}>
                  {v}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="form-pair" style={{ marginTop: 12 }}>
          <button className="button" type="button" onClick={undo} disabled={played === 0}>1つ戻す</button>
          <button className="button" type="button" onClick={reset}>リセット</button>
        </div>
      </section>

      <section aria-label="ラウンド結果" style={{ marginTop: 24 }}>
        <table style={{ width: '100%', textAlign: 'center' }}>
          <thead>
            <tr><th>R</th><th>ターゲット</th><th>マーク</th></tr>
          </thead>
          <tbody>
            {ROUNDS.map((target, i) => (
              <tr key={target}>
                <td>{i + 1}</td>
                <td>{target}</td>
                <td>{marks[i] ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
