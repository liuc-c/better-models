export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface ModelCostFields {
  input?: number
  output?: number
  reasoning?: number
  cache_read?: number
  cache_write?: number
  input_audio?: number
  output_audio?: number
}

export interface ModelCostTier extends ModelCostFields {
  tier?: {
    type?: string
    size?: number
  }
}

export interface ModelCost {
  input: number
  output: number
  reasoning?: number
  cache_read?: number
  cache_write?: number
  input_audio?: number
  output_audio?: number
  context_over_200k?: ModelCost
  tiers?: ModelCostTier[]
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

export interface ModelProviderOverride {
  npm?: string
  api?: string
  shape?: string
  body?: { [key: string]: JsonValue }
  headers?: Record<string, string>
}

export interface ModelExperimentalMode {
  cost?: ModelCostFields
  provider?: ModelProviderOverride
}

export interface ModelExperimental {
  modes?: Record<string, ModelExperimentalMode>
}

export interface Model {
  id: string
  name: string
  family?: string
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
  provider?: ModelProviderOverride
  experimental?: ModelExperimental
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

export interface SelectedModelIdentity {
  modelId: string
  providerId: string | null
}

export interface UrlState {
  search: string
  provider: string
  family: string
  caps: CapabilityKey[]
  inputModality: string[]
  outputModality: string[]
  sortBy: string
  page: number
  modelId: string | null
  modelProviderId: string | null
}
