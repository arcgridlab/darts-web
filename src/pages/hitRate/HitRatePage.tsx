import { useMemo, useState } from 'react'
import { GamePage, MetricStrip } from '../../components/GamePage'
import { saveRecord, todayString } from '../../data/storage'

const ROUNDS = 8
const TARGETS = ['BULL', '20', '19', '18', '17', '16', '15']

export default function HitRatePage() {
  const [target, setTarget] = useState('BULL')
  const [started, setStarted] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [hits, setHits] = useState<(number | null)[]>(Array(ROUNDS).fill(null))
  const [message, setMessage] = useState('')
  const stats = useMemo(() => {
    const entered = hits.filter((value): value is number => value !== null)
    const hitCount = entered.reduce((sum, value) => sum + value, 0)
    const throws = entered.length * 3
    return { rounds: entered.length, hitCount, throws, rate: throws ? hitCount / throws * 100 : 0, hat: entered.filter((value) => value === 3).length }
  }, [hits])
  const finished = started && stats.rounds === ROUNDS

  const resetGame = () => {
    setHits(Array(ROUNDS).fill(null))
    setStarted(false)
    setStartedAt(null)
    setMessage('')
  }

  const startGame = () => {
    setHits(Array(ROUNDS).fill(null))
    setStarted(true)
    setStartedAt(Date.now())
    setMessage('')
  }

  const saveGame = () => {
    if (!finished || message || startedAt === null) return
    const duration = Math.max(1, Math.ceil((Date.now() - startedAt) / 60_000))
    saveRecord({ type: 'hitRate', date: todayString(), duration, target, rounds: ROUNDS, throws: stats.throws, hits: stats.hitCount, hitRate: Math.round(stats.rate * 10) / 10, hat: stats.hat })
    setMessage('結果を保存しました')
  }

  return (
    <GamePage>
      <MetricStrip className="metric-strip hit-rate-metrics" items={[
        { label: 'ROUND', value: `${stats.rounds} / ${ROUNDS}`, unit: 'R' },
        { label: 'HIT RATE', value: `${stats.hitCount} Hit (${stats.rate.toFixed(1)}%)` },
        { label: 'HAT', value: stats.hat, unit: ' TIMES' },
      ]} />
      <div className="game-workspace hit-workspace">
        <section className="play-column">
          <div className="input-section target-select-section">
            <div className="input-title target-select-row">
              <label htmlFor="hit-rate-target">ターゲット</label>
              <select id="hit-rate-target" className="field-control target-select" value={target} onChange={(event) => setTarget(event.target.value)} disabled={started}>
                {TARGETS.map((item) => <option key={item}>{item}</option>)}
              </select>
              <button type="button" className="button button-primary target-control-button" disabled={started && (!finished || !message)} onClick={startGame}>{message ? '次を開始' : started ? '開始済み' : '開始'}</button>
              <button type="button" className="button button-secondary target-control-button" onClick={resetGame}>リセット</button>
            </div>
          </div>
          <div className="round-list">
            {hits.map((hit, index) => <div className="round-item" key={index}>
              <span className="round-label">R{String(index + 1).padStart(2, '0')}</span>
              <div className="choice-inline">{[0, 1, 2, 3].map((value) => <button type="button" className={`small-choice ${hit === value ? 'selected' : ''}`} key={value} disabled={!started || Boolean(message)} onClick={() => { setHits((previous) => previous.map((item, position) => position === index ? value : item)); setMessage('') }}><strong>{value}</strong><small>{value === 1 ? 'HIT' : value === 3 ? 'HAT' : ''}</small></button>)}</div>
            </div>)}
          </div>
        </section>
        <aside className="detail-column">
          <button type="button" className="button button-primary full-button" disabled={!finished || Boolean(message)} onClick={saveGame}>{message ? '保存済み' : '結果を保存'} <span aria-hidden="true">↗</span></button>
        </aside>
      </div>
    </GamePage>
  )
}