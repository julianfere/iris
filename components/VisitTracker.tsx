'use client'

import { useEffect } from 'react'

export default function VisitTracker() {
  useEffect(() => {
    localStorage.setItem('lastVisit', String(Date.now()))
  }, [])

  return null
}
