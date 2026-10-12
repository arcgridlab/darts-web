import { useMemo, useState } from 'react'
import { GamePage, SaveNotice } from '../../components/GamePage'
import { saveRecord, todayString } from '../../data/storage'

const checkoutMap = {
  Single: {
    S1: 1,
    S2: 2,
    S3: 3,
    S4: 4,
    S5: 5,
    S6: 6,
    S7: 7,
    S8: 8,
    S9: 9,
    S10: 10,
    S11: 11,
    S12: 12,
    S13: 13,
    S14: 14,
    S15: 15,
    S16: 16,
    S17: 17,
    S18: 18,
    S19: 19,
    S20: 20
  },
  Double: {
    D1: 2,
    D2: 4,
    D3: 6,
    D4: 8,
    D5: 10,
    D6: 12,
    D7: 14,
    D8: 16,
    D9: 18,
    D10: 20,
    D11: 22,
    D12: 24,
    D13: 26,
    D14: 28,
    D15: 30,
    D16: 32,
    D17: 34,
    D18: 36,
    D19: 38,
    D20: 40
  },
  Triple: {
    T1: 3,
    T2: 6,
    T3: 9,
    T4: 12,
    T5: 15,
    T6: 18,
    T7: 21,
    T8: 24,
    T9: 27,
    T10: 30,
    T11: 33,
    T12: 36,
    T13: 39,
    T14: 42,
    T15: 45,
    T16: 48,
    T17: 51,
    T18: 54,
    T19: 57,
    T20: 60
  },
  BULL: {
    BULL: 50
  }
} as const

const scoreEntries = Object.entries(checkoutMap).flatMap(([, scores]) =>
  Object.entries(scores).map(([label, value]) => ({ label, value }))
)

const containsStrongThrow = (pattern: string[]) =>
  pattern.some((entry) => entry === 'BULL' || entry.startsWith('D') || entry.startsWith('T'))

const hasSingleOnlyCandidate = (pattern: string[]) => {
  if (pattern.length === 0) return false
  const strongEntries = pattern.filter((entry) => entry === 'BULL' || entry.startsWith('D') || entry.startsWith('T'))
  const singleEntries = pattern.filter((entry) => !entry.startsWith('D') && !entry.startsWith('T') && entry !== 'BULL')
  return singleEntries.length === pattern.length && singleEntries.length === 1 && strongEntries.length === 0
}

const buildCheckoutTable = () => {
  const table: Record<number, string[]> = {}

  for (let target = 1; target <= 180; target += 1) {
    const patterns: string[] = []
    const seen = new Set<string>()

    const search = (remaining: number, picks: string[]) => {
      if (remaining === 0 && picks.length > 0) {
        const pattern = picks.join(', ')
        if (!seen.has(pattern) && containsStrongThrow(picks) && !hasSingleOnlyCandidate(picks)) {
          seen.add(pattern)
          patterns.push(pattern)
        }
        return
      }
      if (picks.length >= 3 || remaining < 0) return

      for (const throwOption of scoreEntries) {
        if (throwOption.value > remaining) continue
        const nextPicks = [...picks, throwOption.label]
        search(remaining - throwOption.value, nextPicks)
      }
    }

    search(target, [])

    patterns.sort((left, right) => {
      const leftLength = left.split(', ').length
      const rightLength = right.split(', ').length
      if (leftLength !== rightLength) return leftLength - rightLength
      const leftPriority = left.includes('BULL') ? 0 : left.includes('T') ? 1 : left.includes('D') ? 2 : 3
      const rightPriority = right.includes('BULL') ? 0 : right.includes('T') ? 1 : right.includes('D') ? 2 : 3
      if (leftPriority !== rightPriority) return leftPriority - rightPriority
      return left.localeCompare(right)
    })

    table[target] = patterns.slice(0, 2)
  }

  return table
}

const checkoutTable = buildCheckoutTable()

export default function ArrangePage() {
  const [started, setStarted] = useState(false)
  const [startScore, setStartScore] = useState<number | null>(null)
  const [darts, setDarts] = useState(['', '', ''])
  const [message, setMessage] = useState('')
  const result = useMemo(() => {
    const entered = darts.filter((value) => value !== '').length
    const total = darts.reduce((sum, value) => sum + (value === '' ? 0 : Number(value)), 0)
    const start = startScore ?? 0
    return { entered, total, remaining: start - total, cleared: startScore !== null && total === start, bust: startScore !== null && total > start }
  }, [darts, startScore])
  const finished = started && (result.cleared || result.bust || result.entered === 3)
  const checkoutPatterns = useMemo(() => {
    if (!started || startScore === null) {
      return { pattern1: '', pattern2: '' }
    }

    const patterns = checkoutTable[startScore] ?? ['BULL, D19', 'T20, D20']

    return {
      pattern1: patterns[0] ?? 'BULL, D19',
      pattern2: patterns[1] ?? 'T20, D20'
    }
  }, [startScore, started])

  const startGame = () => {
    if (started && (!finished || !message)) return
    setStartScore(Math.floor(Math.random() * 180) + 1)
    setMessage('')
    setStarted(true)
  }

  const saveGame = () => {
    if (!finished || message || startScore === null) return
    saveRecord({ type: 'arrange', date: todayString(), cleared: result.cleared, startScore, score1: darts[0] === '' ? '' : Number(darts[0]), score2: darts[1] === '' ? '' : Number(darts[1]), score3: darts[2] === '' ? '' : Number(darts[2]) })
    setMessage('結果を保存しました')
  }

  return (
    <GamePage>
      <div className="metric-strip arrange-top-strip">
        <div className="metric-item"><span>Point</span><strong>{started ? (startScore ?? 0) : 0}</strong></div>
        <button type="button" className="button button-primary arrange-start-button" disabled={started && (!finished || !message)} onClick={startGame}>
          <span>開始</span>
        </button>
        <button type="button" className="button button-secondary arrange-reset-button" onClick={() => { setStartScore(null); setDarts(['', '', '']); setMessage(''); setStarted(false) }}>
          <span>リセット</span>
        </button>
      </div>
      <div className="game-workspace arrange-workspace">
        <section className="play-column">
          <div className={`checkout-board ${result.cleared ? 'checkout-clear' : result.bust ? 'checkout-bust' : ''}`}>
            {started && startScore !== null ? (
              <div className="checkout-patterns">
                <div className="checkout-pattern">
                  <span>パターン1</span>
                  <strong>{checkoutPatterns.pattern1}</strong>
                </div>
                <div className="checkout-pattern">
                  <span>パターン2</span>
                  <strong>{checkoutPatterns.pattern2}</strong>
                </div>
              </div>
            ) : (
              <div className="checkout-empty-state" />
            )}
          </div>
          <div className="input-section" />
        </section>
        <aside className="detail-column">
          {finished && <div className={`result-banner ${result.cleared ? 'result-success' : ''}`}><strong>{result.cleared ? 'CHECKOUT' : result.bust ? 'BUST' : 'NO OUT'}</strong><span>{result.cleared ? `${result.entered}投で上がり` : 'このラウンドは終了'}</span></div>}
          <button type="button" className="button button-primary full-button" disabled={!finished || Boolean(message)} onClick={saveGame}>{message ? '保存済み' : '結果を保存'} <span aria-hidden="true">↗</span></button>
          {message && <SaveNotice>{message}</SaveNotice>}
        </aside>
      </div>
    </GamePage>
  )
}