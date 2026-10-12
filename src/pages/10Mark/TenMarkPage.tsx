import { useMemo, useState } from 'react'
import { GamePage } from '../../components/GamePage'
import { saveRecord, todayString } from '../../data/storage'

const TARGETS = [20, 19, 18, 17, 16, 15, 25] as const
const TARGET_LABELS = ['20', '19', '18', '17', '16', '15', 'BULL']
const MAX_ROUNDS = 20
const MAX_DARTS = MAX_ROUNDS * 3

function normalizeMarks(currentProgress: number, marks: number) {
  if (marks === 0) return 0
  if (currentProgress >= 9 && marks >= 2) return 1
  if (currentProgress === 8 && marks === 3) return 2
  return marks
}
function calculateGame(darts: number[]) {
  const progress = Array(TARGETS.length).fill(0) as number[]
  const reached = Array<number | null>(TARGETS.length).fill(null)
  const startRounds = Array<number | null>(TARGETS.length).fill(null)
  const taken = Array<number | null>(TARGETS.length).fill(null)
  const roundScores = Array(MAX_ROUNDS).fill(0) as number[]
  let targetIndex = 0
  let markCount = 0

  darts.forEach((marks, index) => {
    if (targetIndex >= TARGETS.length) return
    const round = Math.floor(index / 3)
    if (startRounds[targetIndex] === null) startRounds[targetIndex] = round + 1
    progress[targetIndex] = Math.min(10, progress[targetIndex] + marks)
    markCount += marks
    roundScores[round] += marks * TARGETS[targetIndex]
    if (progress[targetIndex] >= 10) {
      reached[targetIndex] = round + 1
      taken[targetIndex] = round + 1 - (startRounds[targetIndex] as number) + 1
      targetIndex += 1
    }
  })

  return { progress, reached, taken, roundScores, targetIndex, markCount }
}


export default function TenMarkPage() {
  const [darts, setDarts] = useState<number[]>([])
  const [started, setStarted] = useState(false)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const result = useMemo(() => calculateGame(darts), [darts])
  const rounds = Math.ceil(darts.length / 3)
  const cleared = result.targetIndex === TARGETS.length
  const over = cleared || darts.length >= MAX_DARTS 
  const finished = started && over
  const currentRoundDarts = darts.length % 3
  const roundStartIndex = Math.floor(darts.length / 3) * 3
  const currentRoundValues = darts.slice(roundStartIndex, roundStartIndex + 3)
  const displayedRounds = cleared ? rounds : Math.floor(darts.length / 3)
  const marksPerRound = (rounds ? result.markCount / rounds : 0).toFixed(2)

  const addDart = (marks: number) => {
    if (!started || finished || darts.length >= MAX_DARTS) return
    const currentProgress = result.progress[result.targetIndex] ?? 0
    const normalizedMarks = normalizeMarks(currentProgress, marks)
    setDarts((previous) => [...previous, normalizedMarks])
  }

  const startGame = () => {
    setDarts([])
    setStarted(true)
    setStartedAt(Date.now())
  }

  const resetGame = () => {
    setDarts([])
    setStarted(false)
    setStartedAt(null)
  }

  const saveGame = () => {
    if (!finished || startedAt === null) return
    const roundCount = Math.ceil(darts.length / 3)
    const duration = Math.max(1, Math.ceil((Date.now() - startedAt) / 60_000))
    saveRecord({
      type: '10mark', date: todayString(), duration, cleared, marks: result.markCount, rounds: roundCount, throws: darts.length,
      stat80: result.roundScores.slice(0, roundCount).filter((score) => score >= 80).length,
      stat100: result.roundScores.slice(0, roundCount).filter((score) => score >= 100).length,
      reached20: result.reached[0] ?? '', reached19: result.reached[1] ?? '', reached18: result.reached[2] ?? '',
      reached17: result.reached[3] ?? '', reached16: result.reached[4] ?? '', reached15: result.reached[5] ?? '',
      reachedBull: result.reached[6] ?? '',
    })
    setStarted(false)
  }


  return (
    <GamePage>
      <div className="metric-strip tenmark-metrics">
        <div className="metric-item"><span>ラウンド数</span><strong>{displayedRounds}<small> / {MAX_ROUNDS}R</small></strong></div>
        <div className="metric-item"><span>投数</span><strong>{darts.length}<small> DARTS</small></strong></div>
        <div className="metric-item"><span>スタッツ</span><strong>{marksPerRound}</strong></div>
        <div className="tenmark-button-group">
          <button type="button" className="button button-primary tenmark-start-button" disabled={started} onClick={startGame}>開始</button>
          <button type="button" className="button button-secondary tenmark-start-button" disabled={!started} onClick={resetGame}>リセット</button>
        </div>
      </div>

      <div className="game-workspace">
        <section className="play-column">
          <div className="target-board">
            <div className="score-result" style={{ visibility: over ? 'visible' : 'hidden' }}>
              <strong>{cleared ? 'CLEAR' : `NOT CLEAR (上限${MAX_ROUNDS}Rに到達)`}</strong>
            </div>
            <div className="target-status-list">
              {TARGET_LABELS.map((label, index) =>
                <div
                  className={`target-status-row ${index === result.targetIndex && !cleared ? 'is-current' : ''}`}
                  key={label}
                >
                  <span className="target-status-name">{label}</span>
                  <span className="target-status-track">
                    <i style={{ width: `${result.progress[index] * 10}%` }} />
                  </span>
                  <span className="target-status-value">
                    {/* {result.reached[index] ? `${result.reached[index]}R` : `${result.progress[index]}/10`}*/}
                    {result.taken[index] !== null ? `${result.taken[index]}R` : `${result.progress[index]}/10`}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="input-section">
            <div className="round-list tenmark-round-list">
              {[0, 1, 2].map((dartIndex) => <div className={`round-item tenmark-round-item ${started && dartIndex === currentRoundDarts && !finished ? 'is-active' : ''}`} key={dartIndex}>
                <span className="round-label">DART {dartIndex + 1}</span>
                <div className="choice-inline tenmark-choice-inline">
                  {[0, 1, 2, 3].map((value) => <button type="button" className={`small-choice ${currentRoundValues[dartIndex] === value ? 'selected' : ''}`} key={value} disabled={!started || finished || dartIndex !== currentRoundDarts} onClick={() => addDart(value)}><strong>{value}</strong><small>{['MISS', 'SINGLE', 'DOUBLE', 'TRIPLE'][value]}</small></button>)}
                </div>
              </div>)}
            </div>
          </div>
          <div className="play-actions">
            <button type="button" className="button button-secondary" disabled={!started || !darts.length || finished} onClick={() => { setDarts((previous) => previous.slice(0, -1));}}>一投戻す</button>
          </div>
        </section>

        <aside className="detail-column tenmark-save-column">
          <button type="button" className="button button-primary full-button" disabled={!finished} onClick={saveGame}>結果を保存<span aria-hidden="true">↗</span></button>
        </aside>
      </div>
    </GamePage>
  )
}