export interface ModelCost {
  input: number
  output: number
  cache_read?: number
  cache_write?: number
}

export interface ModelLimit {
  context: number
  output: number
}

export interface ModelModalities {
  input: string[]
  output: string[]
}

export interface Model {
  id: string
  name: string
  family: string
  attachment?: boolean
  reasoning?: boolean
  tool_call?: boolean
  structured_output?: boolean
  interleaved?: { field: string }
  temperature?: boolean
  knowledge?: string
  release_date?: string
  last_updated?: string
  modalities?: ModelModalities
  open_weights?: boolean
  cost?: ModelCost
  limit?: ModelLimit
}

export interface Provider {
  id: string
  name: string
  env?: string[]
  npm?: string
  api?: string
  doc?: string
  models: Record<string, Model>
}

export type ApiResponse = Record<string, Provider>

export interface FlattenedModel extends Model {
  providerId: string
  providerName: string
  providerNpm?: string
  providerApi?: string
  providerDoc?: string
  providerEnv?: string[]
}

export type CapabilityKey = 'reasoning' | 'tool_call' | 'structured_output' | 'attachment' | 'open_weights'

export interface UrlState {
  search: string
  provider: string
  caps: CapabilityKey[]
  sortBy: string
  page: number
  modelId: string | null
}
