import React from 'react'

export function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '' || value === '-') return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm text-right max-w-[60%] ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
