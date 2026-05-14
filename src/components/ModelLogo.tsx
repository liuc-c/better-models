import { useMemo, useState } from 'react'
import type { FlattenedModel } from '@/types'
import type { LogoSource } from '@/lib/utils'
import { getFamilyIconSources, getModelIconSources, getProviderLogoSources } from '@/lib/utils'

export function ModelLogo({ model, className = '' }: { model: FlattenedModel; className?: string }) {
  return (
    <ProviderLogo
      providerId={model.providerId}
      alt={model.providerName}
      className={className}
    />
  )
}

export function ProviderLogo({
  providerId,
  alt = providerId,
  className = '',
}: {
  providerId: string
  alt?: string
  className?: string
}) {
  const sources = useMemo(() => getProviderLogoSources(providerId), [providerId])
  const [fallbackState, setFallbackState] = useState({ providerId, sourceIndex: 0 })

  const sourceIndex = fallbackState.providerId === providerId ? fallbackState.sourceIndex : 0
  const source = sources[sourceIndex]
  
  if (!source) {
    return (
      <div className={`bg-muted rounded flex items-center justify-center text-muted-foreground text-xs font-medium ${className}`}>
        {providerId.charAt(0).toUpperCase()}
      </div>
    )
  }
  
  return (
    <img
      src={source.url}
      alt={alt}
      className={`object-contain ${source.invertInDark ? 'dark:invert dark:brightness-90' : ''} ${className}`}
      onError={() => setFallbackState({ providerId, sourceIndex: sourceIndex + 1 })}
    />
  )
}

function InlineLogoSource({
  sources,
  sourceKey,
  className = '',
}: {
  sources: LogoSource[]
  sourceKey: string
  className?: string
}) {
  const [fallbackState, setFallbackState] = useState({ sourceKey, sourceIndex: 0 })
  const sourceIndex = fallbackState.sourceKey === sourceKey ? fallbackState.sourceIndex : 0
  const source = sources[sourceIndex]

  if (!source) return null

  return (
    <img
      src={source.url}
      alt=""
      aria-hidden="true"
      className={`object-contain ${source.invertInDark ? 'dark:invert dark:brightness-90' : ''} ${className}`}
      onError={() => setFallbackState({ sourceKey, sourceIndex: sourceIndex + 1 })}
    />
  )
}

export function FamilyIcon({ family, className = '' }: { family?: string | null; className?: string }) {
  const sources = useMemo(() => getFamilyIconSources(family), [family])
  return <InlineLogoSource sources={sources} sourceKey={family ?? ''} className={className} />
}

export function ModelFamilyIcon({
  model,
  className = '',
}: {
  model: FlattenedModel
  className?: string
}) {
  const sources = useMemo(() => getModelIconSources(model), [model])
  const sourceKey = `${model.providerId}:${model.id}:${model.family ?? ''}:${model.name}`
  return <InlineLogoSource sources={sources} sourceKey={sourceKey} className={className} />
}
