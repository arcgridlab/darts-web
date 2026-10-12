import { useEffect, useMemo, useState } from 'react'
import { GamePage } from '../../components/GamePage'
import { getDailySummary, loadRecords, STORAGE_EVENT, todayString, type GameType, type SessionRecord } from '../../data/storage'
import { loadMemos, MEMO_EVENT, type MemoMap } from '../../data/memoStorage'

const labels: Record<GameType, string> = {
  practice: '練習時間',
  '10mark': '10Mark',
  hitRate: 'Hit率',
  inBullRate: 'INBULL',
  arrange: 'アレンジ',
}

const schemas: Partial<Record<GameType, { key: string; label: string; percent?: boolean }[]>> = {
  practice: [
    { key: 'duration', label: '練習時間 (分)' }, { key: 'throws', label: '本数' }, { key: 'hat', label: 'HAT数' },
  ],
  '10mark': [
    { key: 'cleared', label: 'クリア' }, { key: 'marks', label: 'マーク数' }, { key: 'rounds', label: 'ラウンド数' }, { key: 'throws', label: '投数' },
    { key: 'stat80', label: 'スタッツ80' }, { key: 'stat100', label: 'スタッツ100' }, { key: 'reached20', label: '到達R [20]' },
    { key: 'reached19', label: '到達R [19]' }, { key: 'reached18', label: '到達R [18]' }, { key: 'reached17', label: '到達R [17]' },
    { key: 'reached16', label: '到達R [16]' }, { key: 'reached15', label: '到達R [15]' }, { key: 'reachedBull', label: '到達R [BULL]' },
  ],
  hitRate: [
    { key: 'target', label: 'ターゲット' }, { key: 'rounds', label: 'ラウンド数' }, { key: 'throws', label: '本数' }, { key: 'hits', label: 'Hit数' }, { key: 'hitRate', label: 'Hit率', percent: true }, { key: 'hat', label: 'Hat数' },
  ],
  inBullRate: [
    { key: 'cleared', label: 'クリア' }, { key: 'score', label: '点数' }, { key: 'rounds', label: 'ラウンド数' }, { key: 'throws', label: '本数' },
    { key: 'inBullCount', label: 'INBULL数' }, { key: 'bullCount', label: 'BULL数' }, { key: 'inBullRate', label: 'INBULL率', percent: true },
    { key: 'bullRate', label: 'BULL率', percent: true }, { key: 'hat', label: 'Hat数' },
  ],
  arrange: [
    { key: 'cleared', label: 'クリア' }, { key: 'startScore', label: 'スタート点数' }, { key: 'score1', label: '点数1' }, { key: 'score2', label: '点数2' }, { key: 'score3', label: '点数3' },
  ],
}

type HistoryFilter = 'all' | 'memo' | Exclude<GameType, 'arrange'>

const filters: HistoryFilter[] = ['all', 'practice', '10mark', 'hitRate', 'inBullRate', 'memo']

const MEMO_LABEL = 'MEMO'

function filterLabel(item: HistoryFilter) {
  if (item === 'all') return 'すべて'
  if (item === 'memo') return MEMO_LABEL
  return labels[item]
}

function displayValue(record: SessionRecord, key: string, percent = false) {
  const value = record[key]
  if (value === '' || value === null || value === undefined) return '—'
  if (key === 'cleared') return value ? 'CLEAR' : '未達'
  return `${String(value)}${percent ? '%' : ''}`
}

function summary(record: SessionRecord) {
  if (record.type === 'practice') return `${record.duration}分 · ${record.throws}本 · HAT ${record.hat}`
  if (record.type === '10mark') return `${record.marks}マーク · ${record.rounds}R · ${record.throws}投`
  if (record.type === 'hitRate') return `${record.target} · ${record.hitRate}% · ${record.hits}/${record.throws}本`
  if (record.type === 'inBullRate') return `${record.score}点 · ${record.inBullRate}% / ${record.bullRate}% · ${record.rounds}R`
  return `${record.startScore}点スタート · ${record.score1 ?? '—'} / ${record.score2 ?? '—'} / ${record.score3 ?? '—'}`
}

const exportFieldLabels: Record<string, string> = {
  duration: '時間 (分)', throws: '本数', bull: 'BULL数', hat: 'HAT数', bet: 'BET数', target: 'ターゲット',
  rounds: 'ラウンド数', hits: 'Hit数', hitRate: 'Hit率', cleared: '結果', marks: 'マーク数', score: '点数',
  stat80: 'スタッツ80', stat100: 'スタッツ100', reached20: '到達R [20]', reached19: '到達R [19]',
  reached18: '到達R [18]', reached17: '到達R [17]', reached16: '到達R [16]', reached15: '到達R [15]',
  reachedBull: '到達R [BULL]', inBullCount: 'INBULL数', bullCount: 'BULL数', inBullRate: 'INBULL率',
  bullRate: 'BULL率', startScore: 'スタート点数', score1: '点数1', score2: '点数2', score3: '点数3',
}

function exportSummary(record: SessionRecord) {
  return Object.entries(record)
    .filter(([key, value]) => !['id', 'type', 'date'].includes(key) && value !== '' && value !== null && value !== undefined)
    .map(([key]) => `${exportFieldLabels[key] ?? key}: ${displayValue(record, key, ['hitRate', 'inBullRate', 'bullRate'].includes(key))}`)
    .join(' · ')
}

export default function HistoryPage() {
  const [records, setRecords] = useState<SessionRecord[]>(loadRecords)
  const [memos, setMemos] = useState<MemoMap>(loadMemos)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [selectedDate, setSelectedDate] = useState(todayString)

  useEffect(() => {
    const refresh = () => {
      setRecords(loadRecords())
      setMemos(loadMemos())
    }
    window.addEventListener(STORAGE_EVENT, refresh)
    window.addEventListener(MEMO_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(STORAGE_EVENT, refresh)
      window.removeEventListener(MEMO_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const historyRecords = records.filter((record) => record.type !== 'arrange')
  const availableDates = useMemo(
    () => [...new Set([todayString(), ...records.map((record) => record.date), ...Object.keys(memos)])].sort((first, second) => second.localeCompare(first)),
    [records, memos],
  )
  const dailyPracticeRecords = useMemo<SessionRecord[]>(() => [...new Set(records.map((record) => record.date))].map((date) => ({
    id: `practice-summary-${date}`,
    type: 'practice' as const,
    date,
    ...getDailySummary(records, date),
  })), [records])
  const visibleRecords = useMemo(() => {
    const matchesDate = (record: SessionRecord) => !selectedDate || record.date === selectedDate
    if (filter === 'memo') return []
    if (filter === 'practice') return dailyPracticeRecords.filter(matchesDate)
    if (filter === 'all') return [...historyRecords.filter((record) => matchesDate(record) && record.type !== 'practice'), ...dailyPracticeRecords.filter(matchesDate)]
    return historyRecords.filter((record) => matchesDate(record) && record.type === filter)
  }, [dailyPracticeRecords, filter, historyRecords, selectedDate])
  // 選択中の日付に合うメモ(新しい日付が上)
  const visibleMemos = useMemo(
    () => Object.entries(memos)
      .filter(([date, text]) => text && (!selectedDate || date === selectedDate))
      .sort(([first], [second]) => second.localeCompare(first)),
    [memos, selectedDate],
  )
  const showMemos = filter === 'all' || filter === 'memo'
  const rowCount = (filter === 'memo' ? 0 : visibleRecords.length) + (showMemos ? visibleMemos.length : 0)

  // PDF出力用: 記録 + メモ(日付の新しい順)
  const pdfRows = useMemo(() => [
    ...records.map((record) => ({
      key: record.id,
      date: record.date,
      game: labels[record.type],
      result: record.cleared === undefined ? '記録' : record.cleared ? 'CLEAR' : '未達',
      detail: exportSummary(record),
    })),
    ...Object.entries(memos).filter(([, text]) => text).map(([date, text]) => ({
      key: `memo-${date}`,
      date,
      game: MEMO_LABEL,
      result: '記録',
      detail: text,
    })),
  ].sort((first, second) => second.date.localeCompare(first.date)), [records, memos])

  return (
    <GamePage>
      <section className="history-section">
        <div className="history-toolbar">
          <div className="history-toolbar-actions">
            <label className="history-filter"><select className="field-control" aria-label="日付" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}><option value="">日付指定なし</option>{availableDates.map((date) => <option value={date} key={date}>{date === todayString() ? `${date} (今日)` : date}</option>)}</select></label>
            <button className="button button-secondary history-export-button" type="button" onClick={() => window.print()} disabled={!pdfRows.length}>PDF出力</button>
          </div>
        </div>
        <div className="history-tabs" role="group" aria-label="ゲーム別表示">
          {filters.map((item) => <button type="button" className={`history-tab ${filter === item ? 'active' : ''}`} aria-pressed={filter === item} key={item} onClick={() => setFilter(item)}>{filterLabel(item)}</button>)}
        </div>
        {rowCount ? (
          <div className="table-scroll">
            {filter === 'memo' ? (
              <table className="history-table">
                <thead><tr><th>日付</th><th>メモ</th></tr></thead>
                <tbody>
                  {visibleMemos.map(([date, text]) => (
                    <tr key={date}>
                      <td className="date-cell">{date}</td>
                      <td className="summary-cell" style={{ whiteSpace: 'pre-wrap' }}>{text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className={`history-table ${filter === 'practice' ? 'practice-table' : ''}`}>
                <thead>
                  <tr>{filter === 'all' ? <><th>日付</th><th>ゲーム</th><th>結果</th><th>サマリー</th></> : <><th>日付</th>{(schemas[filter] ?? []).map((column) => <th key={column.key}>{column.label}</th>)}</>}</tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record) => <tr key={record.id}>{filter === 'all' ? <><td className="date-cell">{record.date}</td><td><span className="type-label">{labels[record.type]}</span></td><td><span className={`status-label ${record.cleared ? 'status-clear' : ''}`}>{record.cleared === undefined ? '記録' : record.cleared ? 'CLEAR' : '未達'}</span></td><td className="summary-cell">{summary(record)}</td></> : <><td className="date-cell">{record.date}</td>{(schemas[filter] ?? []).map((column) => <td key={column.key}>{displayValue(record, column.key, column.percent)}</td>)}</>}</tr>)}
                  {filter === 'all' && visibleMemos.map(([date, text]) => (
                    <tr key={`memo-${date}`}>
                      <td className="date-cell">{date}</td>
                      <td><span className="type-label">{MEMO_LABEL}</span></td>
                      <td><span className="status-label">記録</span></td>
                      <td className="summary-cell" style={{ whiteSpace: 'pre-wrap' }}>{text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : <div className="empty-state"><span>0</span><strong>記録はまだありません</strong><p>ゲームをプレイして結果を保存すると、ここに表示されます。</p></div>}
      </section>
      <section className="pdf-report">
        <header className="pdf-report-heading"><p>DARTS PRACTICE LOG</p><h1>すべての記録</h1><span>出力日: {todayString()} · {pdfRows.length} records</span></header>
        <table className="pdf-report-table"><thead><tr><th>日付</th><th>ゲーム</th><th>結果</th><th>記録詳細</th></tr></thead><tbody>
          {pdfRows.map((row) => <tr key={row.key}>
            <td>{row.date}</td><td>{row.game}</td>
            <td>{row.result}</td>
            <td style={{ whiteSpace: 'pre-wrap' }}>{row.detail}</td>
          </tr>)}
        </tbody></table>
      </section>
    </GamePage>
  )
}
