import React, { useState, useEffect } from 'react'
import { useFetch, apiPost } from '../hooks/useApi.js'
import PageHeader from '../components/PageHeader.jsx'
import './Profile.css'

const GENDERS = ['male', 'female', 'non-binary', 'prefer not to say']

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'HN'
}

function calcAge(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function calcBMI(height, weight) {
  if (!height || !weight) return null
  return (weight / ((height / 100) ** 2)).toFixed(1)
}

function bmiLabel(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Underweight', color: '#f59e0b' }
  if (bmi < 25) return { label: 'Healthy', color: '#10b981' }
  if (bmi < 30) return { label: 'Overweight', color: '#f59e0b' }
  return { label: 'Obese', color: '#ef4444' }
}

export default function Profile() {
  const { data: profile, loading, refetch } = useFetch('/api/profile')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile && !form) setForm({ ...profile })
  }, [profile])

  function startEdit() {
    setForm({ ...profile })
    setEditing(true)
    setSaved(false)
  }

  function cancelEdit() {
    setForm({ ...profile })
    setEditing(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      await refetch()
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  if (loading) return <div className="profile-loading">Loading profile...</div>

  const bmi = calcBMI(profile?.height_cm, profile?.weight_kg)
  const bmiInfo = bmiLabel(bmi)
  const age = calcAge(profile?.date_of_birth)

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Personal information and health goals"
        action={
          !editing
            ? <button className="btn-primary" onClick={startEdit}>✏️ Edit Profile</button>
            : null
        }
      />

      {saved && (
        <div className="save-toast">✅ Profile saved successfully!</div>
      )}

      <div className="profile-layout">
        <div className="profile-sidebar">
          <div className="avatar-block">
            <div className="avatar">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" />
                : <span>{getInitials(profile?.full_name)}</span>
              }
            </div>
            <h2 className="profile-name">{profile?.full_name}</h2>
            <p className="profile-email">{profile?.email}</p>
            {age && <p className="profile-meta">{age} years old · {profile?.gender}</p>}
          </div>

          <div className="stat-pills">
            <div className="stat-pill">
              <span className="stat-pill-val">{profile?.height_cm ? `${profile.height_cm} cm` : '—'}</span>
              <span className="stat-pill-label">Height</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-val">{profile?.weight_kg ? `${profile.weight_kg} kg` : '—'}</span>
              <span className="stat-pill-label">Weight</span>
            </div>
            {bmi && (
              <div className="stat-pill">
                <span className="stat-pill-val" style={{color: bmiInfo.color}}>{bmi}</span>
                <span className="stat-pill-label">BMI · {bmiInfo.label}</span>
              </div>
            )}
          </div>

          {profile?.bio && (
            <p className="profile-bio">"{profile.bio}"</p>
          )}
        </div>

        <div className="profile-main">
          {!editing ? (
            <>
              <section className="profile-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="info-grid">
                  <InfoRow label="Full Name" value={profile?.full_name} />
                  <InfoRow label="Email" value={profile?.email} />
                  <InfoRow label="Date of Birth" value={profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : null} />
                  <InfoRow label="Gender" value={profile?.gender} />
                  <InfoRow label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : null} />
                  <InfoRow label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : null} />
                </div>
              </section>

              <section className="profile-section">
                <h3 className="section-title">Health Goals</h3>
                <div className="goals-grid">
                  <GoalCard icon="👟" label="Daily Steps" value={profile?.goal_steps?.toLocaleString()} target="goal" />
                  <GoalCard icon="🌙" label="Sleep Target" value={`${profile?.goal_sleep_hours} hrs`} target="goal" />
                  <GoalCard icon="❤️" label="Max Heart Rate" value={`${profile?.goal_heart_rate_max} bpm`} target="goal" />
                </div>
              </section>
            </>
          ) : (
            <form onSubmit={handleSave} className="profile-form">
              <section className="profile-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="form-grid">
                  <FormRow label="Full Name">
                    <input value={form?.full_name || ''} onChange={e => setField('full_name', e.target.value)} />
                  </FormRow>
                  <FormRow label="Email">
                    <input type="email" value={form?.email || ''} onChange={e => setField('email', e.target.value)} />
                  </FormRow>
                  <FormRow label="Date of Birth">
                    <input type="date" value={form?.date_of_birth ? form.date_of_birth.slice(0,10) : ''} onChange={e => setField('date_of_birth', e.target.value)} />
                  </FormRow>
                  <FormRow label="Gender">
                    <select value={form?.gender || ''} onChange={e => setField('gender', e.target.value)}>
                      <option value="">Select...</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </FormRow>
                  <FormRow label="Height (cm)">
                    <input type="number" value={form?.height_cm || ''} onChange={e => setField('height_cm', e.target.value)} min="50" max="250" />
                  </FormRow>
                  <FormRow label="Weight (kg)">
                    <input type="number" step="0.1" value={form?.weight_kg || ''} onChange={e => setField('weight_kg', e.target.value)} min="20" max="300" />
                  </FormRow>
                  <FormRow label="Avatar URL" span>
                    <input value={form?.avatar_url || ''} onChange={e => setField('avatar_url', e.target.value)} placeholder="https://..." />
                  </FormRow>
                  <FormRow label="Bio" span>
                    <textarea value={form?.bio || ''} onChange={e => setField('bio', e.target.value)} rows={3} placeholder="A short description about yourself..." />
                  </FormRow>
                </div>
              </section>

              <section className="profile-section">
                <h3 className="section-title">Health Goals</h3>
                <div className="form-grid">
                  <FormRow label="Daily Steps Target">
                    <input type="number" value={form?.goal_steps || ''} onChange={e => setField('goal_steps', parseInt(e.target.value))} min="1000" max="50000" step="500" />
                  </FormRow>
                  <FormRow label="Sleep Target (hours)">
                    <input type="number" step="0.5" value={form?.goal_sleep_hours || ''} onChange={e => setField('goal_sleep_hours', parseFloat(e.target.value))} min="4" max="12" />
                  </FormRow>
                  <FormRow label="Max Heart Rate (bpm)">
                    <input type="number" value={form?.goal_heart_rate_max || ''} onChange={e => setField('goal_heart_rate_max', parseInt(e.target.value))} min="60" max="220" />
                  </FormRow>
                </div>
              </section>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value || <em style={{color:'var(--color-text-faint)'}}>Not set</em>}</span>
    </div>
  )
}

function GoalCard({ icon, label, value }) {
  return (
    <div className="goal-card">
      <span className="goal-icon">{icon}</span>
      <div>
        <div className="goal-val">{value}</div>
        <div className="goal-label">{label}</div>
      </div>
    </div>
  )
}

function FormRow({ label, children, span }) {
  return (
    <div className={`form-row${span ? ' span-full' : ''}`}>
      <label>{label}</label>
      {children}
    </div>
  )
}
