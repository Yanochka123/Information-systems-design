import React, { useState } from 'react'
import { useFetch, apiPost } from '../hooks/useApi.js'
import PageHeader from '../components/PageHeader.jsx'
import './Recommendations.css'

const PRIORITY_COLOR = { high: '#ef4444', normal: '#6366f1', low: '#10b981' }
const CATEGORY_ICON = { heart: '❤️', activity: '🏃', sleep: '🌙', nutrition: '🥗', stress: '🧘' }

export default function Recommendations() {
  const { data: recs, loading, refetch } = useFetch('/api/recommendations')
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    setGenerating(true)
    try {
      await apiPost('/api/recommendations/generate', {})
      refetch()
    } finally {
      setGenerating(false)
    }
  }

  const grouped = {}
  for (const r of (recs || [])) {
    if (!grouped[r.priority]) grouped[r.priority] = []
    grouped[r.priority].push(r)
  }

  return (
    <div>
      <PageHeader
        title="Recommendations"
        subtitle="Personalized wellness tips based on your health data"
        action={
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? '⏳ Generating...' : '🤖 Generate New'}
          </button>
        }
      />

      {loading ? (
        <div className="loading-text">Loading recommendations...</div>
      ) : !recs?.length ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>No recommendations yet</h3>
          <p>Simulate some device readings first, then click "Generate New" to get personalized health tips.</p>
        </div>
      ) : (
        <div className="recs-layout">
          {['high', 'normal', 'low'].map(priority => {
            const items = grouped[priority]
            if (!items?.length) return null
            return (
              <div key={priority} className="rec-group">
                <div className="rec-group-header">
                  <span className="priority-dot" style={{background: PRIORITY_COLOR[priority]}}/>
                  <span className="priority-label">{priority} priority</span>
                  <span className="priority-count">{items.length}</span>
                </div>
                <div className="rec-cards">
                  {items.map(r => (
                    <div key={r.id} className="rec-card" style={{'--rec-color': PRIORITY_COLOR[r.priority]}}>
                      <div className="rec-top">
                        <span className="rec-icon">{CATEGORY_ICON[r.category] || '💡'}</span>
                        <span className="rec-category">{r.category}</span>
                        <span className="rec-device">{r.device_name}</span>
                      </div>
                      <p className="rec-message">{r.message}</p>
                      <div className="rec-time">{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
