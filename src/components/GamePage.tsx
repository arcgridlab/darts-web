import type { ReactNode } from 'react'

type GamePageProps = {
  children: ReactNode
}

export function GamePage({ children }: GamePageProps) {
  return (
    <div className="page-shell game-page">
      {children}
    </div>
  )
}

export function MetricStrip({ items, className = 'metric-strip' }: { items: { label: string; value: string | number; unit?: string }[]; className?: string }) {
  return (
    <div className={className}>
      {items.map((item) => (
        <div className="metric-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}<small>{item.unit}</small></strong>
        </div>
      ))}
    </div>
  )
}

export function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="field-label">日付<input className="field-control" type="date" value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

export function SaveNotice({ children }: { children: ReactNode }) {
  return <p className="save-notice" role="status">{children}</p>
}