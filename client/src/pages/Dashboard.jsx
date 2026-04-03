import React from 'react'
import { useFetch, apiPost } from '../hooks/useApi.js'
import MetricCard from '../components/MetricCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import './Dashboard.css'

export default function Dashboard() {
  const { data: summary, loading: sumLoading } = useFetch('/api/vitals/summary')
  const { data: trends, loading: trendsLoading, refetch: refetchTrends } = useFetch('/api/vitals/trends')
  const { data: latest, loading: latestLoading, refetch: refetchLatest } = useFetch('/api/vitals/latest')
  const { data: recs } = useFetch('/api/recommendations')

  async function handleSimulate() {
    await apiPost('/api/vitals/simulate', {})
    refetchTrends()
    refetchLatest()
  }

  const trendData = (trends || []).map(r => ({
    time: new Date(r.hour).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    'Heart Rate': r.avg_heart_rate,
    'SpO2': r.avg_spo2,
    'Steps': Math.round(r.avg_steps / 100)
  }))

  const highPriority = (recs || []).filter(r => r.priority === 'high').slice(0, 3)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your health monitoring data"
        action={
          <button className="btn-primary" onClick={handleSimulate}>
            ⚡ Simulate Reading
          </button>
        }
      />

      {sumLoading ? (
        <div className="loading-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton-card"/>)}
        </div>
      ) : (
        <div className="metrics-grid">
          <MetricCard
            title="Avg Heart Rate"
            value={summary?.avg_heart_rate}
            unit="bpm"
            icon="❤️"
            color="#ef4444"
            sub={`Max: ${summary?.max_heart_rate} · Min: ${summary?.min_heart_rate}`}
          />
          <MetricCard
            title="Total Steps"
            value={summary?.total_steps?.toLocaleString()}
            icon="👟"
            color="#10b981"
            sub={`Avg per session: ${summary?.avg_steps?.toLocaleString()}`}
          />
          <MetricCard
            title="Avg Sleep"
            value={summary?.avg_sleep_hours}
            unit="hrs"
            icon="🌙"
            color="#6366f1"
            sub="Recommended: 7–9 hours"
          />
          <MetricCard
            title="Avg SpO2"
            value={summary?.avg_spo2}
            unit="%"
            icon="💨"
            color="#06b6d4"
            sub="Normal range: 95–100%"
          />
        </div>
      )}

      <div className="dashboard-bottom">
        <div className="chart-panel">
          <h2 className="panel-title">Vital Signs — Last 24h</h2>
          {trendsLoading ? (
            <div className="skeleton-chart"/>
          ) : trendData.length === 0 ? (
            <div className="empty-chart">No trend data yet. Simulate a reading to get started.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{top:8, right:16, left:-20, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" tick={{fill:'#94a3b8', fontSize:11}} />
                <YAxis tick={{fill:'#94a3b8', fontSize:11}} />
                <Tooltip
                  contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9'}}
                  labelStyle={{color:'#94a3b8', fontSize:12}}
                />
                <Legend wrapperStyle={{fontSize:12, color:'#94a3b8'}}/>
                <Line type="monotone" dataKey="Heart Rate" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="SpO2" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Steps" stroke="#10b981" strokeWidth={2} dot={false} name="Steps ×100" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="side-panels">
          <div className="panel">
            <h2 className="panel-title">Active Devices</h2>
            {latestLoading ? <div className="skeleton-list"/> : (
              <div className="device-list">
                {(latest || []).map(d => (
                  <div key={d.device_id} className="device-row">
                    <div className="device-dot" style={{background: d.device_type === 'smartwatch' ? '#10b981' : '#6366f1'}}/>
                    <div>
                      <div className="device-name">{d.device_name}</div>
                      <div className="device-sub">{d.device_type.replace('_', ' ')} · HR: {d.heart_rate} bpm</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {highPriority.length > 0 && (
            <div className="panel alert-panel">
              <h2 className="panel-title">⚠️ Alerts</h2>
              {highPriority.map(r => (
                <div key={r.id} className="alert-item">
                  <span className="alert-badge">{r.category}</span>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
