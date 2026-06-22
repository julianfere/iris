'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export default function PushSubscribeButton() {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied'); return
    }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub =>
        setStatus(sub ? 'subscribed' : 'unsubscribed')
      )
    )
  }, [])

  async function subscribe() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
    })
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
    setStatus('subscribed')
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setStatus('unsubscribed')
  }

  async function handleClick() {
    if (status === 'unsubscribed') {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { setStatus('denied'); return }
      }
      await subscribe()
    } else if (status === 'subscribed') {
      await unsubscribe()
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  if (status === 'denied') return (
    <span style={{ fontSize: 12, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>
      Notificaciones bloqueadas
    </span>
  )

  const active = status === 'subscribed'
  return (
    <button
      onClick={handleClick}
      style={{
        background: 'none',
        border: `1px solid ${active ? 'var(--ac)' : 'var(--line)'}`,
        color: active ? 'var(--ac)' : 'var(--dim)',
        cursor: 'pointer',
        fontFamily: 'var(--font)',
        fontSize: 13,
        padding: '8px 14px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        {active && <line x1="1" y1="1" x2="23" y2="23"/>}
      </svg>
      {active ? 'Sin notificaciones' : 'Notificaciones'}
    </button>
  )
}
