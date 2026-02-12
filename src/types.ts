export interface ModelCost {
  input: number
  output: number
  reasoning?: number
  cache_read?: number
  cache_write?: number
  input_audio?: number
  output_audio?: number
  context_over_200k?: ModelCost
}

export interface ModelLimit {
  context: number
  input?: number
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
  interleaved?: true | { field: 'reasoning_content' | 'reasoning_details' }
  temperature?: boolean
  knowledge?: string
  release_date?: string
  last_updated?: string
  modalities?: ModelModalities
  open_weights?: boolean
  cost?: ModelCost
  limit?: ModelLimit
  status?: 'alpha' | 'beta' | 'deprecated'
  provider?: { npm?: string; api?: string }
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
