import React, { useState } from 'react'
import { useFetch, apiPost } from '../hooks/useApi.js'
import PageHeader from '../components/PageHeader.jsx'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './Vitals.css'

const SLEEP_QUALITY_COLOR = { excellent: '#10b981', good: '#6366f1', fair: '#f59e0b', poor: '#ef4444' }

export default function Vitals() {
  const { data: devices } = useFetch('/api/devices')
  const [selectedDevice, setSelectedDevice] = useState('')
  const { data: vitals, loading, refetch } = useFetch(
    `/api/vitals?${selectedDevice ? `device_id=${selectedDevice}&` : ''}limit=30`
  )
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ device_id: '', heart_rate: '', steps: '', sleep_hours: '', sleep_quality: 'good', spo2: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiPost('/api/vitals', {
        device_id: form.device_id,
        heart_rate: form.heart_rate ? parseInt(form.heart_rate) : undefined,
        steps: form.steps ? parseInt(form.steps) : undefined,
        sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : undefined,
        sleep_quality: form.sleep_quality,
        spo2: form.spo2 ? parseInt(form.spo2) : undefined
      })
      setShowForm(false)
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  const chartData = (vitals || []).slice().reverse().map(v => ({
    time: new Date(v.recorded_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
    'Heart Rate': v.heart_rate,
    'SpO2': v.spo2
  }))

  return (
    <div>
      <PageHeader
        title="Vital Signs"
        subtitle="All health readings from your devices"
        action={
          <div style={{display:'flex', gap:8}}>
            <select
              className="filter-select"
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
            >
              <option value="">All Devices</option>
              {(devices || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Cancel' : '+ Log Reading'}
            </button>
          </div>
        }
      />

      {showForm && (
        <form className="vitals-form" onSubmit={handleSubmit}>
          <h3>Log Manual Reading</h3>
          <div className="form-grid">
            <div className="form-row">
              <label>Device *</label>
              <select value={form.device_id} onChange={e => setForm({...form, device_id: e.target.value})} required>
                <option value="">Select device</option>
                {(devices || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>Heart Rate (bpm)</label>
              <input type="number" value={form.heart_rate} onChange={e => setForm({...form, heart_rate: e.target.value})} placeholder="72" min="30" max="220"/>
            </div>
            <div className="form-row">
              <label>Steps</label>
              <input type="number" value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="8000" min="0"/>
            </div>
            <div className="form-row">
              <label>Sleep (hours)</label>
              <input type="number" value={form.sleep_hours} onChange={e => setForm({...form, sleep_hours: e.target.value})} placeholder="7.5" step="0.1" min="0" max="24"/>
            </div>
            <div className="form-row">
              <label>Sleep Quality</label>
              <select value={form.sleep_quality} onChange={e => setForm({...form, sleep_quality: e.target.value})}>
                {['excellent','good','fair','poor'].map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label>SpO2 (%)</label>
              <input type="number" value={form.spo2} onChange={e => setForm({...form, spo2: e.target.value})} placeholder="98" min="80" max="100"/>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Reading'}
          </button>
        </form>
      )}

      {chartData.length > 0 && (
        <div className="chart-panel">
          <h2 className="panel-title">Heart Rate & SpO2 Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{top:8, right:16, left:-20, bottom:0}}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
              <XAxis dataKey="time" tick={{fill:'#94a3b8', fontSize:11}}/>
              <YAxis tick={{fill:'#94a3b8', fontSize:11}}/>
              <Tooltip contentStyle={{background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#f1f5f9'}}/>
              <Area type="monotone" dataKey="Heart Rate" stroke="#ef4444" fill="url(#hrGrad)" strokeWidth={2}/>
              <Area type="monotone" dataKey="SpO2" stroke="#06b6d4" fill="url(#spo2Grad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading ? (
        <div className="loading-text">Loading readings...</div>
      ) : (
        <div className="vitals-table-wrap">
          <table className="vitals-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Time</th>
                <th>Heart Rate</th>
                <th>Steps</th>
                <th>Sleep</th>
                <th>SpO2</th>
              </tr>
            </thead>
            <tbody>
              {(vitals || []).map(v => (
                <tr key={v.id}>
                  <td>
                    <span className="device-badge">{v.device_name}</span>
                  </td>
                  <td className="muted">{new Date(v.recorded_at).toLocaleString()}</td>
                  <td>{v.heart_rate ? `${v.heart_rate} bpm` : '—'}</td>
                  <td>{v.steps ? v.steps.toLocaleString() : '—'}</td>
                  <td>
                    {v.sleep_hours ? (
                      <span>
                        {v.sleep_hours}h
                        {v.sleep_quality && (
                          <span className="sleep-badge" style={{background: SLEEP_QUALITY_COLOR[v.sleep_quality] + '22', color: SLEEP_QUALITY_COLOR[v.sleep_quality]}}>
                            {v.sleep_quality}
                          </span>
                        )}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{v.spo2 ? `${v.spo2}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
