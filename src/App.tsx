import { useEffect, useState, type FormEvent } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import HistoryPage from './pages/history/HistoryPage'
import HitRatePage from './pages/hitRate/HitRatePage'
import InBullRatePage from './pages/inBullRate/InBullRatePage'
import TenMarkPage from './pages/10Mark/TenMarkPage'
import { getDailySummary, loadRecords, saveRecord, STORAGE_EVENT, todayString } from './data/storage'
import type { SessionRecord } from './data/storage'
import './App.css'

const navigation = [
  { to: '/hit-rate', index: '01', label: 'HIT RATE', detail: 'ターゲット命中率' },
  { to: '/10mark', index: '02', label: '10MARK', detail: 'クリケットナンバー' },
  { to: '/in-bull', index: '03', label: 'INBULL', detail: 'ブルの精度' },
  { to: '/history', index: '04', label: 'HISTORY', detail: 'プレイ記録' },
]

function DailySummary() {
  const [records, setRecords] = useState<SessionRecord[]>(loadRecords)

  useEffect(() => {
    const refresh = () => setRecords(loadRecords())
    window.addEventListener(STORAGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(STORAGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const { duration: practiceMinutes, throws: todayThrows, hats: todayHats } = getDailySummary(records, todayString())

  return (
    <section className="daily-summary" aria-label="本日の練習状況">
      <div className="daily-summary-item daily-summary-date"><span>今日</span><strong>{todayString()}</strong></div>
      <div className="daily-summary-item"><span>練習時間</span><strong>{practiceMinutes}<small>分</small></strong></div>
      <div className="daily-summary-item"><span>本数</span><strong>{todayThrows}<small>本</small></strong></div>
      <div className="daily-summary-item"><span>HAT数</span><strong>{todayHats}</strong></div>
    </section>
  )
}

function Dashboard() {
  const [records, setRecords] = useState<SessionRecord[]>(loadRecords)
  const [date, setDate] = useState(todayString())
  const [duration, setDuration] = useState('')
  const [throws, setThrows] = useState('')
  const [bulls, setBulls] = useState('0')
  const [hats, setHats] = useState('0')
  const [bets, setBets] = useState('0')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const refresh = () => setRecords(loadRecords())
    window.addEventListener(STORAGE_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(STORAGE_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    saveRecord({
      type: 'practice', date, duration: Number(duration), throws: Number(throws),
      bull: Number(bulls), hat: Number(hats), bet: Number(bets),
    })
    setDuration('')
    setThrows('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const todayRecords = records.filter((record) => record.date === todayString())
  const todayBulls = todayRecords.reduce((total, record) => total + Number(record.bull ?? record.bullCount ?? 0), 0)

  return (
    <div className="page-shell dashboard-page">
      <header className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">TRAINING DESK</p>
        </div>
      </header>

      <section className="dashboard-grid" aria-label="練習メニュー">
        <div className="game-list">
          {navigation.slice(0, 3).map((item) => (
            <Link className="game-link" to={item.to} key={item.to}>
              <span className="game-index">{item.index}</span>
              <span className="game-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
              <span className="game-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
          <Link className="history-link" to="/history">すべての記録を見る <span aria-hidden="true">→</span></Link>
        </div>

        <section className="practice-panel">
          <div className="panel-title-row"><div><p className="eyebrow">FREE SESSION</p><h2>練習時間を記録</h2></div><span className="panel-mark">＋</span></div>
          <form className="practice-form" onSubmit={onSubmit}>
            <label>日付<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <div className="form-pair">
              <label>時間 <span>分</span><input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} required /></label>
              <label>本数<input type="number" min="1" value={throws} onChange={(event) => setThrows(event.target.value)} required /></label>
            </div>
            <div className="form-trio">
              <label>BULL<input type="number" min="0" value={bulls} onChange={(event) => setBulls(event.target.value)} required /></label>
              <label>Hat<input type="number" min="0" value={hats} onChange={(event) => setHats(event.target.value)} required /></label>
              <label>BET<input type="number" min="0" value={bets} onChange={(event) => setBets(event.target.value)} required /></label>
            </div>
            <button className="button button-primary full-button" type="submit">{saved ? '保存しました' : '練習を保存'} <span aria-hidden="true">↗</span></button>
          </form>
        </section>
      </section>

      <section className="dashboard-footer">
        <div><span className="footer-dot" />本日のブル</div><strong>{todayBulls}<small> BULL</small></strong>
        <p>セッションはこの端末に保存されます。</p>
      </section>
    </div>
  )
}

function AppFrame() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="brand"><span className="brand-symbol">D</span><span>DARTS<small> PRACTICE LOG</small></span></Link>
        <nav className="side-nav">
          {navigation.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>{item.label}</NavLink>)}
        </nav>
      </header>
      <main className="main-content">
        <DailySummary />
        <Routes>
          <Route path="/" element={<Navigate to="/hit-rate" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/10mark" element={<TenMarkPage />} />
          <Route path="/hit-rate" element={<HitRatePage />} />
          <Route path="/in-bull" element={<InBullRatePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/hit-rate" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <BrowserRouter basename="/darts-web"><AppFrame /></BrowserRouter>
}
