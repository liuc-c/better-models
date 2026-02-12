import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Image, Mic, Video, FileJson } from 'lucide-react'
import type { ApiResponse, FlattenedModel, CapabilityKey, UrlState } from '@/types'
import { CAPABILITIES, DEFAULT_URL_STATE, URL_KEYS, SORT_KEYS, LOGO_BASE_URL } from '@/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parsePageNumber(value: string | null): number {
  if (!value) return DEFAULT_URL_STATE.page
  const num = Number.parseInt(value, 10)
  if (!Number.isFinite(num) || num < 1) return DEFAULT_URL_STATE.page
  return num
}

export function parseUrlStateFromSearch(search: string): UrlState {
  const params = new URLSearchParams(search)

  const q = params.get(URL_KEYS.search) ?? DEFAULT_URL_STATE.search
  const provider = params.get(URL_KEYS.provider) ?? DEFAULT_URL_STATE.provider
  const inputModalityRaw = params.get(URL_KEYS.inputModality)
  const inputModality = inputModalityRaw
    ? inputModalityRaw.split(',').map((v) => v.trim()).filter(Boolean)
    : []

  const outputModalityRaw = params.get(URL_KEYS.outputModality)
  const outputModality = outputModalityRaw
    ? outputModalityRaw.split(',').map((v) => v.trim()).filter(Boolean)
    : []

  const sortBy = params.get(URL_KEYS.sort) ?? DEFAULT_URL_STATE.sortBy
  const page = parsePageNumber(params.get(URL_KEYS.page))
  const modelId = params.get(URL_KEYS.model)

  const capabilityKeySet = new Set<CapabilityKey>(CAPABILITIES.map((c) => c.key))
  const capsRaw = params.get(URL_KEYS.caps)
  const capsFromCsv = capsRaw
    ? capsRaw.split(',').map((v) => v.trim()).filter(Boolean)
    : []
  const capsFromRepeated = params.getAll(URL_KEYS.cap)
  const capsFromUrl = Array.from(new Set([...capsFromCsv, ...capsFromRepeated]))
    .filter((key): key is CapabilityKey => capabilityKeySet.has(key as CapabilityKey))

  return {
    search: q,
    provider,
    caps: capsFromUrl,
    inputModality,
    outputModality,
    sortBy: SORT_KEYS.has(sortBy) ? sortBy : DEFAULT_URL_STATE.sortBy,
    page,
    modelId: modelId || null,
  }
}

export function buildUrlSearchFromState(state: UrlState): string {
  const params = new URLSearchParams()

  if (state.search.trim()) params.set(URL_KEYS.search, state.search.trim())
  if (state.provider !== DEFAULT_URL_STATE.provider) params.set(URL_KEYS.provider, state.provider)
  if (state.caps.length > 0) params.set(URL_KEYS.caps, state.caps.join(','))
  if (state.inputModality.length > 0) params.set(URL_KEYS.inputModality, state.inputModality.join(','))
  if (state.outputModality.length > 0) params.set(URL_KEYS.outputModality, state.outputModality.join(','))
  if (state.sortBy !== DEFAULT_URL_STATE.sortBy) params.set(URL_KEYS.sort, state.sortBy)
  if (state.page !== DEFAULT_URL_STATE.page) params.set(URL_KEYS.page, String(state.page))
  if (state.modelId) params.set(URL_KEYS.model, state.modelId)

  const next = params.toString()
  return next ? `?${next}` : ''
}

export function shouldIgnoreKeydownTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

export function getModalityIcon(modality: string) {
  switch (modality) {
    case 'image':
      return Image
    case 'audio':
      return Mic
    case 'video':
      return Video
    default:
      return FileJson
  }
}

export function formatCost(cost: number): string {
  if (cost === 0) return 'Free'
  if (cost < 0.001) return `$${cost.toFixed(6)}`
  if (cost < 1) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

export function formatTokens(tokens: number): string {
  if (tokens === 0) return '-'
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
  return tokens.toString()
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return dateStr
}

export function getProviderLogoUrl(providerId: string): string {
  return `${LOGO_BASE_URL}/${providerId}.svg`
}

export function flattenModels(data: ApiResponse): FlattenedModel[] {
  const models: FlattenedModel[] = []
  
  for (const [providerId, provider] of Object.entries(data)) {
    if (!provider.models) continue
    
    for (const model of Object.values(provider.models)) {
      models.push({
        ...model,
        providerId,
        providerName: provider.name,
        providerNpm: model.provider?.npm ?? provider.npm,
        providerApi: model.provider?.api ?? provider.api,
        providerDoc: provider.doc,
        providerEnv: provider.env,
      })
    }
  }
  
  return models.sort((a, b) => {
    const dateA = a.last_updated || ''
    const dateB = b.last_updated || ''
    return dateB.localeCompare(dateA)
  })
}

export function extractProviders(data: ApiResponse): { id: string; name: string }[] {
  return Object.entries(data)
    .map(([id, provider]) => ({ id, name: provider.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
