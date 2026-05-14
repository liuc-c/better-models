import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Image, Mic, Video, FileJson } from 'lucide-react'
import type { ApiResponse, FlattenedModel, CapabilityKey, UrlState } from '@/types'
import {
  CAPABILITIES,
  DEFAULT_URL_STATE,
  URL_KEYS,
  SORT_KEYS,
  LOGO_BASE_URL,
  LOBE_ICON_BASE_URL,
  LOBE_COLOR_ICON_SLUGS,
  MODEL_FAMILY_LOBE_ICON_PREFIXES,
  MODEL_FAMILY_LOBE_ICON_SLUGS,
  MODEL_TEXT_LOBE_ICON_MATCHERS,
  PROVIDER_LOBE_ICON_SLUGS,
} from '@/constants'

const MODEL_METADATA_KEYS = new Set([
  'providerId',
  'providerName',
  'providerNpm',
  'providerApi',
  'providerDoc',
  'providerEnv',
])

export interface CostLabels {
  free: string
  unknown: string
}

export interface LogoSource {
  url: string
  invertInDark: boolean
}

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
  const family = params.get(URL_KEYS.family) ?? DEFAULT_URL_STATE.family
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
  const modelProviderId = params.get(URL_KEYS.modelProvider)

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
    family,
    caps: capsFromUrl,
    inputModality,
    outputModality,
    sortBy: SORT_KEYS.has(sortBy) ? sortBy : DEFAULT_URL_STATE.sortBy,
    page,
    modelId: modelId || null,
    modelProviderId: modelProviderId || null,
  }
}

export function buildUrlSearchFromState(state: UrlState): string {
  const params = new URLSearchParams()

  if (state.search.trim()) params.set(URL_KEYS.search, state.search.trim())
  if (state.provider !== DEFAULT_URL_STATE.provider) params.set(URL_KEYS.provider, state.provider)
  if (state.family !== DEFAULT_URL_STATE.family) params.set(URL_KEYS.family, state.family)
  if (state.caps.length > 0) params.set(URL_KEYS.caps, state.caps.join(','))
  if (state.inputModality.length > 0) params.set(URL_KEYS.inputModality, state.inputModality.join(','))
  if (state.outputModality.length > 0) params.set(URL_KEYS.outputModality, state.outputModality.join(','))
  if (state.sortBy !== DEFAULT_URL_STATE.sortBy) params.set(URL_KEYS.sort, state.sortBy)
  if (state.page !== DEFAULT_URL_STATE.page) params.set(URL_KEYS.page, String(state.page))
  if (state.modelId) params.set(URL_KEYS.model, state.modelId)
  if (state.modelProviderId) params.set(URL_KEYS.modelProvider, state.modelProviderId)

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

export function formatCost(cost: number | null | undefined, labels: CostLabels): string {
  if (cost === undefined || cost === null) return labels.unknown
  if (cost === 0) return labels.free
  if (cost < 0.001) return `$${cost.toFixed(6)}`
  if (cost < 1) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

export function formatCostPerMillion(cost: number | null | undefined, labels: CostLabels): string {
  if (cost === undefined || cost === null) return labels.unknown
  return `${formatCost(cost, labels)}/1M`
}

export function compareOptionalCost(a: number | undefined, b: number | undefined, direction: 'asc' | 'desc'): number {
  const aKnown = a !== undefined
  const bKnown = b !== undefined
  if (!aKnown && !bKnown) return 0
  if (!aKnown) return 1
  if (!bKnown) return -1
  return direction === 'asc' ? a - b : b - a
}

export function formatTokens(tokens?: number | null): string {
  if (!tokens) return '-'
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
  return tokens.toString()
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  return dateStr
}

export function getProviderLogoUrl(providerId: string): string {
  return `${LOGO_BASE_URL}/${providerId}.svg`
}

export function getLobeIconUrlForSlug(slug: string, variant: 'mono' | 'color' = 'mono'): string {
  return `${LOBE_ICON_BASE_URL}/${slug}${variant === 'color' ? '-color' : ''}.svg`
}

export function getLobeIconUrl(providerId: string, variant: 'mono' | 'color' = 'mono'): string | null {
  const slug = PROVIDER_LOBE_ICON_SLUGS[providerId]
  if (!slug) return null
  return getLobeIconUrlForSlug(slug, variant)
}

export function getProviderLogoSources(providerId: string): LogoSource[] {
  const slug = PROVIDER_LOBE_ICON_SLUGS[providerId]
  const lobeIconSources: LogoSource[] = slug
    ? [
      ...(LOBE_COLOR_ICON_SLUGS.has(slug)
        ? [{ url: getLobeIconUrl(providerId, 'color') as string, invertInDark: false }]
        : []),
      { url: getLobeIconUrl(providerId) as string, invertInDark: true },
    ]
    : []

  return [
    ...lobeIconSources,
    { url: getProviderLogoUrl(providerId), invertInDark: true },
  ]
}

function includesModelTerm(text: string, term: string): boolean {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`, 'i').test(text)
}

export function getFamilyIconSlug(family?: string | null): string | null {
  const normalizedFamily = family?.toLowerCase()
  if (!normalizedFamily) return null

  const exactSlug = MODEL_FAMILY_LOBE_ICON_SLUGS[normalizedFamily]
  if (exactSlug) return exactSlug

  const prefixMatch = MODEL_FAMILY_LOBE_ICON_PREFIXES.find(([prefix]) => normalizedFamily.startsWith(prefix))
  return prefixMatch?.[1] ?? null
}

export function getModelIconSlug(model: Pick<FlattenedModel, 'family' | 'id' | 'name'>): string | null {
  const familySlug = getFamilyIconSlug(model.family)
  if (familySlug) return familySlug

  const modelText = `${model.id} ${model.name}`.toLowerCase()
  const textMatch = MODEL_TEXT_LOBE_ICON_MATCHERS.find(({ terms }) =>
    terms.some((term) => includesModelTerm(modelText, term)),
  )

  return textMatch?.slug ?? null
}

function getLobeLogoSourcesForSlug(slug: string): LogoSource[] {
  return [
    ...(LOBE_COLOR_ICON_SLUGS.has(slug)
      ? [{ url: getLobeIconUrlForSlug(slug, 'color'), invertInDark: false }]
      : []),
    { url: getLobeIconUrlForSlug(slug), invertInDark: true },
  ]
}

export function getFamilyIconSources(family?: string | null): LogoSource[] {
  const slug = getFamilyIconSlug(family)
  return slug ? getLobeLogoSourcesForSlug(slug) : []
}

export function getModelIconSources(model: Pick<FlattenedModel, 'family' | 'id' | 'name'>): LogoSource[] {
  const slug = getModelIconSlug(model)
  return slug ? getLobeLogoSourcesForSlug(slug) : []
}

export function stringifyModelDefinition(model: FlattenedModel): string {
  const jsonContent = JSON.stringify(
    model,
    (key, value) => (MODEL_METADATA_KEYS.has(key) ? undefined : value),
    2,
  )
  return `"${model.id}": ${jsonContent}`
}

export function getCompleteModelMetadata(model: FlattenedModel) {
  const {
    providerId,
    providerName,
    providerNpm,
    providerApi,
    providerDoc,
    providerEnv,
    ...modelData
  } = model

  return {
    provider: {
      id: providerId,
      name: providerName,
      npm: providerNpm,
      api: providerApi,
      doc: providerDoc,
      env: providerEnv,
    },
    model: modelData,
  }
}

export function stringifyCompleteModelMetadata(model: FlattenedModel): string {
  return JSON.stringify(getCompleteModelMetadata(model), null, 2)
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

export function extractFamilies(models: FlattenedModel[]): string[] {
  return Array.from(new Set(models.map((model) => model.family).filter((family): family is string => Boolean(family))))
    .sort((a, b) => {
      const aHasIcon = getFamilyIconSlug(a) !== null
      const bHasIcon = getFamilyIconSlug(b) !== null
      if (aHasIcon !== bHasIcon) return aHasIcon ? -1 : 1
      return a.localeCompare(b)
    })
}
