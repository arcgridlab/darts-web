import { useMemo, useState } from 'react'
import { GamePage } from '../../components/GamePage'
import { saveRecord, todayString } from '../../data/storage'

type BullOutcome = 'inner' | 'outer' | 'miss'
type Throw = { throwNo: number; round: number; dartIndex: number; hit: BullOutcome }

const MAX_THROWS = 45
const MAX_ROUNDS = Math.ceil(MAX_THROWS / 3)
const TARGET_SCORE = 10

export default function InBullRatePage() {
  /****************************************
   * state
   ****************************************/
  const [throws, setThrows] = useState<Throw[]>([]) // 1投ごとの事実
  const [started, setStarted] = useState(false)     // ゲーム中かどうか

  /****************************************
   * 導出値(state にしない)
   ****************************************/
  const date = todayString()

  const stats = useMemo(() => {
    const inBullCount = throws.filter((t) => t.hit === 'inner').length
    const missCount = throws.filter((t) => t.hit === 'miss').length
    const bullCount = throws.length - missCount
    const rounds = Math.ceil(throws.length / 3)
    const hats = Array.from({ length: rounds }, (_, i) => throws.filter((t) => t.round === i + 1))
      .filter((r) => r.length === 3 && r.every((t) => t.hit !== 'miss')).length
    return {
      inBullCount,
      bullCount,
      score: inBullCount - missCount,
      rounds,
      hats,
      inBullRate: throws.length ? (inBullCount / throws.length) * 100 : 0,
      bullRate: throws.length ? (bullCount / throws.length) * 100 : 0,
    }
  }, [throws])

  const cleared = stats.score >= TARGET_SCORE
  const finished = cleared || throws.length >= MAX_THROWS
  const nextActiveDart = throws.length % 3

  // 現在のラウンドの投(ハイライト用)。3投目の直後は次ラウンドの0投分になり、空表示になる
  const currentRound = Math.floor(throws.length / 3) + 1
  const currentThrows = throws.filter((t) => t.round === currentRound)
  const selectedHit = (dartIndex: number) => currentThrows.find((t) => t.dartIndex === dartIndex)?.hit

  /****************************************
   * 各種関数
   ****************************************/
  const startGame = () => {
    setThrows([])
    setStarted(true)
  }

  const resetGame = () => {
    setThrows([])
    setStarted(false)
  }

  const addThrow = (hit: BullOutcome) => {
    if (!started || finished) return
    setThrows((prev) => {
      const throwNo = prev.length + 1
      return [...prev, { throwNo, round: Math.ceil(throwNo / 3), dartIndex: (throwNo - 1) % 3, hit }]
    })
  }

  const undoThrow = () => setThrows((prev) => prev.slice(0, -1))

  const saveGame = () => {
    if (!started || !finished) return
    saveRecord({
      type: 'inBullRate',
      date,
      cleared,
      score: stats.score,
      rounds: stats.rounds,
      throws: throws.length,
      inBullCount: stats.inBullCount,
      bullCount: stats.bullCount,
      inBullRate: Math.round(stats.inBullRate * 10) / 10,
      bullRate: Math.round(stats.bullRate * 10) / 10,
      hat: stats.hats,
    })
    setStarted(false) // 結果は画面に残したまま、保存ボタンだけ無効になる
  }

  return (
    <GamePage>
      <div className="metric-strip tenmark-metrics">
        <div className="metric-item"><span>ラウンド数</span><strong>{stats.rounds}<small> / {MAX_ROUNDS}R</small></strong></div>
        <div className="metric-item"><span>INBULL</span><strong>{stats.inBullCount} ({stats.inBullRate.toFixed(1)}%)</strong></div>
        <div className="metric-item"><span>BULL</span><strong>{stats.bullCount} ({stats.bullRate.toFixed(1)}%)</strong></div>
        <div className="tenmark-button-group">
          <button type="button" className="button button-primary tenmark-start-button" disabled={started} onClick={startGame}>開始</button>
          <button type="button" className="button button-secondary tenmark-start-button" disabled={!started} onClick={resetGame}>リセット</button>
        </div>
      </div>
      <div className="game-workspace">
        <section className="play-column">
          <div className="score-board score-cleared" aria-live="polite">
            <div className="score-result" style={{ visibility: finished ? 'visible' : 'hidden' }}>
              <strong>{cleared ? 'CLEAR' : `NOT CLEAR (上限${MAX_ROUNDS}Rに到達)`}</strong>
            </div>
            <strong>{stats.score}<small> / {TARGET_SCORE}</small></strong>
            <div className="score-rail"><i style={{ width: `${Math.max(0, Math.min(100, (stats.score / TARGET_SCORE) * 100))}%` }} /></div>
            <span>あと {Math.max(0, TARGET_SCORE - stats.score)} 点</span>
          </div>
          <div className="input-section">
            <div className="round-list">
              {[0, 1, 2].map((dartIndex) => (
                <div className="round-item" key={dartIndex}>
                  <span className="round-label">DART {dartIndex + 1}</span>
                  <div className="choice-inline">
                    <button type="button" className={`small-choice ${selectedHit(dartIndex) === 'inner' ? 'selected' : ''}`} disabled={!started || finished || dartIndex !== nextActiveDart} onClick={() => addThrow('inner')}><strong>INBULL (+1)</strong></button>
                    <button type="button" className={`small-choice ${selectedHit(dartIndex) === 'outer' ? 'selected' : ''}`} disabled={!started || finished || dartIndex !== nextActiveDart} onClick={() => addThrow('outer')}><strong>BULL (+0)</strong></button>
                    <button type="button" className={`small-choice ${selectedHit(dartIndex) === 'miss' ? 'selected' : ''}`} disabled={!started || finished || dartIndex !== nextActiveDart} onClick={() => addThrow('miss')}><strong>OTHER (-1)</strong></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="play-actions">
            <button type="button" className="button button-secondary" disabled={!throws.length || finished} onClick={undoThrow}>一投戻す</button>
          </div>
        </section>
        <aside className="detail-column">
          <button type="button" className="button button-primary full-button" disabled={!(started && finished)} onClick={saveGame}>結果を保存 <span aria-hidden="true">↗</span></button>
        </aside>
      </div>
    </GamePage>
  )
}