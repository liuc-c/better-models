import { Brain, Wrench, FileJson, Image, Scale } from 'lucide-react'
import type { UrlState } from './types'

export const API_URL = 'https://models.dev/api.json'
export const LOGO_BASE_URL = 'https://models.dev/logos'
export const PAGE_SIZE = 24
export const SESSION_CACHE_KEY = 'better-models-cache'

export const CAPABILITIES = [
  { key: 'reasoning', label: 'Reasoning', icon: Brain },
  { key: 'tool_call', label: 'Tool Call', icon: Wrench },
  { key: 'structured_output', label: 'Structured Output', icon: FileJson },
  { key: 'attachment', label: 'Attachment', icon: Image },
  { key: 'open_weights', label: 'Open Weights', icon: Scale },
] as const

export const URL_KEYS = {
  search: 'q',
  provider: 'provider',
  caps: 'caps',
  cap: 'cap',
  inputModality: 'in',
  outputModality: 'out',
  sort: 'sort',
  page: 'page',
  model: 'model',
} as const

export const DEFAULT_URL_STATE: UrlState = {
  search: '',
  provider: 'all',
  caps: [],
  inputModality: [],
  outputModality: [],
  sortBy: 'lastUpdated',
  page: 1,
  modelId: null,
}

export const SORT_KEYS = new Set([
  'lastUpdated',
  'releaseDate',
  'name',
  'nameDesc',
  'contextSize',
  'inputCost',
  'inputCostDesc',
  'outputCost',
  'outputCostDesc',
])
