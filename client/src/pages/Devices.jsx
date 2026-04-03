import React, { useState } from 'react'
import { useFetch, apiPost, apiPatch, apiDelete } from '../hooks/useApi.js'
import PageHeader from '../components/PageHeader.jsx'
import './Devices.css'

const DEVICE_TYPES = ['smartwatch', 'fitness_bracelet', 'medical_sensor', 'heart_monitor', 'glucose_monitor']

export default function Devices() {
  const { data: devices, loading, refetch } = useFetch('/api/devices')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'smartwatch', model: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await apiPost('/api/devices', form)
      setForm({ name: '', type: 'smartwatch', model: '' })
      setShowForm(false)
      refetch()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(device) {
    const next = device.status === 'active' ? 'inactive' : 'active'
    await apiPatch(`/api/devices/${device.id}/status`, { status: next })
    refetch()
  }

  async function handleDelete(id) {
    if (!confirm('Remove this device and all its readings?')) return
    await apiDelete(`/api/devices/${id}`)
    refetch()
  }

  const typeIcon = (t) => ({
    smartwatch: '⌚', fitness_bracelet: '💪', medical_sensor: '🩺',
    heart_monitor: '❤️', glucose_monitor: '🩸'
  }[t] || '📟')

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage connected wearable devices"
        action={
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Device'}
          </button>
        }
      />

      {showForm && (
        <form className="device-form" onSubmit={handleAdd}>
          <h3>Register New Device</h3>
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <label>Device Name *</label>
            <input
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="e.g. My Apple Watch"
              required
            />
          </div>
          <div className="form-row">
            <label>Type *</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Model</label>
            <input
              value={form.model}
              onChange={e => setForm({...form, model: e.target.value})}
              placeholder="e.g. Series 9"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register Device'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="devices-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton-device"/>)}
        </div>
      ) : (
        <div className="devices-grid">
          {(devices || []).map(device => (
            <div key={device.id} className={`device-card ${device.status}`}>
              <div className="device-card-top">
                <div className="device-type-icon">{typeIcon(device.type)}</div>
                <span className={`device-status-badge ${device.status}`}>{device.status}</span>
              </div>
              <h3 className="device-card-name">{device.name}</h3>
              <div className="device-card-meta">
                <span>{device.type.replace('_', ' ')}</span>
                {device.model && <span>· {device.model}</span>}
              </div>
              <div className="device-card-date">
                Registered {new Date(device.registered_at).toLocaleDateString()}
              </div>
              <div className="device-card-actions">
                <button
                  className={`btn-toggle ${device.status === 'active' ? 'active' : ''}`}
                  onClick={() => toggleStatus(device)}
                >
                  {device.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn-delete" onClick={() => handleDelete(device.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
