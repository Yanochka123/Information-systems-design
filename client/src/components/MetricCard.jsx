import React from 'react'
import './MetricCard.css'

export default function MetricCard({ title, value, unit, icon, color, trend, sub }) {
  return (
    <div className="metric-card" style={{'--card-color': color || 'var(--color-primary)'}}>
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">
        {value !== null && value !== undefined ? value : '—'}
        {unit && <span className="metric-unit"> {unit}</span>}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
      {trend !== undefined && (
        <div className={`metric-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
