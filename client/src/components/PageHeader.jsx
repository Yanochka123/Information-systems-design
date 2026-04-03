import React from 'react'

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 28}}>
      <div>
        <h1 style={{fontSize: 24, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4}}>{title}</h1>
        {subtitle && <p style={{fontSize: 14, color: 'var(--color-text-muted)'}}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
