import { useState } from 'react'
import type { FlattenedModel } from '@/types'
import { getProviderLogoUrl } from '@/lib/utils'

export function ModelLogo({ model, className = '' }: { model: FlattenedModel; className?: string }) {
  const [error, setError] = useState(false)
  
  if (error) {
    return (
      <div className={`bg-muted rounded flex items-center justify-center text-muted-foreground text-xs font-medium ${className}`}>
        {model.providerId.charAt(0).toUpperCase()}
      </div>
    )
  }
  
  return (
    <img
      src={getProviderLogoUrl(model.providerId)}
      alt={model.providerId}
      className={`object-contain dark:invert dark:brightness-90 ${className}`}
      onError={() => setError(true)}
    />
  )
}

export function ProviderLogo({ providerId, className = '' }: { providerId: string; className?: string }) {
  const [error, setError] = useState(false)
  
  if (error) {
    return (
      <div className={`bg-muted rounded flex items-center justify-center text-muted-foreground text-xs font-medium ${className}`}>
        {providerId.charAt(0).toUpperCase()}
      </div>
    )
  }
  
  return (
    <img
      src={getProviderLogoUrl(providerId)}
      alt={providerId}
      className={`object-contain dark:invert dark:brightness-90 ${className}`}
      onError={() => setError(true)}
    />
  )
}
