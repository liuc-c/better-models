import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Copy, Check, Search, Brain, Wrench, FileJson, Image, Mic, Video, 
  ChevronLeft, ChevronRight, Moon, Sun, Package, Calendar, ExternalLink,
  Info, Scale, Sparkles, Languages, Rocket, RefreshCw, Filter
} from 'lucide-react'
import type { ApiResponse, FlattenedModel } from '@/types'

const API_URL = 'https://models.dev/api.json'
const LOGO_BASE_URL = 'https://models.dev/logos'
const PAGE_SIZE = 24
const SESSION_CACHE_KEY = 'better-models-cache'

const CAPABILITIES = [
  { key: 'reasoning', label: 'Reasoning', icon: Brain },
  { key: 'tool_call', label: 'Tool Call', icon: Wrench },
  { key: 'structured_output', label: 'Structured Output', icon: FileJson },
  { key: 'attachment', label: 'Attachment', icon: Image },
  { key: 'open_weights', label: 'Open Weights', icon: Scale },
] as const

type CapabilityKey = (typeof CAPABILITIES)[number]['key']

const URL_KEYS = {
  search: 'q',
  provider: 'provider',
  caps: 'caps',
  cap: 'cap',
  sort: 'sort',
  page: 'page',
  model: 'model',
} as const

type UrlState = {
  search: string
  provider: string
  caps: CapabilityKey[]
  sortBy: string
  page: number
  modelId: string | null
}

const DEFAULT_URL_STATE: UrlState = {
  search: '',
  provider: 'all',
  caps: [],
  sortBy: 'lastUpdated',
  page: 1,
  modelId: null,
}

const SORT_KEYS = new Set([
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

function parsePageNumber(value: string | null): number {
  if (!value) return DEFAULT_URL_STATE.page
  const num = Number.parseInt(value, 10)
  if (!Number.isFinite(num) || num < 1) return DEFAULT_URL_STATE.page
  return num
}

function parseUrlStateFromSearch(search: string): UrlState {
  const params = new URLSearchParams(search)

  const q = params.get(URL_KEYS.search) ?? DEFAULT_URL_STATE.search
  const provider = params.get(URL_KEYS.provider) ?? DEFAULT_URL_STATE.provider
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
    sortBy: SORT_KEYS.has(sortBy) ? sortBy : DEFAULT_URL_STATE.sortBy,
    page,
    modelId: modelId || null,
  }
}

function buildUrlSearchFromState(state: UrlState): string {
  const params = new URLSearchParams()

  if (state.search.trim()) params.set(URL_KEYS.search, state.search.trim())
  if (state.provider !== DEFAULT_URL_STATE.provider) params.set(URL_KEYS.provider, state.provider)
  if (state.caps.length > 0) params.set(URL_KEYS.caps, state.caps.join(','))
  if (state.sortBy !== DEFAULT_URL_STATE.sortBy) params.set(URL_KEYS.sort, state.sortBy)
  if (state.page !== DEFAULT_URL_STATE.page) params.set(URL_KEYS.page, String(state.page))
  if (state.modelId) params.set(URL_KEYS.model, state.modelId)

  const next = params.toString()
  return next ? `?${next}` : ''
}

function shouldIgnoreKeydownTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

function getModalityIcon(modality: string) {
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

function formatCost(cost: number): string {
  if (cost === 0) return 'Free'
  if (cost < 0.001) return `$${cost.toFixed(6)}`
  if (cost < 1) return `$${cost.toFixed(4)}`
  return `$${cost.toFixed(2)}`
}

function formatTokens(tokens: number): string {
  if (tokens === 0) return '-'
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
  return tokens.toString()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return dateStr
}

function getProviderLogoUrl(providerId: string): string {
  return `${LOGO_BASE_URL}/${providerId}.svg`
}

function ModelLogo({ model, className = '' }: { model: FlattenedModel; className?: string }) {
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

function ProviderLogo({ providerId, className = '' }: { providerId: string; className?: string }) {
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

function flattenModels(data: ApiResponse): FlattenedModel[] {
  const models: FlattenedModel[] = []
  
  for (const [providerId, provider] of Object.entries(data)) {
    if (!provider.models) continue
    
    for (const model of Object.values(provider.models)) {
      models.push({
        ...model,
        providerId,
        providerName: provider.name,
        providerNpm: provider.npm,
        providerApi: provider.api,
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

function extractProviders(data: ApiResponse): { id: string; name: string }[] {
  return Object.entries(data)
    .map(([id, provider]) => ({ id, name: provider.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// Detail row component for the sheet
function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '' || value === '-') return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-sm text-right max-w-[60%] ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}

// Model detail sheet
function ModelDetailSheet({ 
  model, 
  open, 
  onOpenChange 
}: { 
  model: FlattenedModel | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  
  const handleCopyJson = useCallback(() => {
    if (!model) return
    const { providerId: _p, providerName: _pn, providerNpm: _npm, providerApi: _api, providerDoc: _doc, providerEnv: _env, ...modelData } = model
    const jsonContent = JSON.stringify(modelData, null, 2)
    const output = `"${model.id}": ${jsonContent}`
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [model])
  
  if (!model) return null
  
  const { providerId: _p, providerName: _pn, providerNpm: _npm, providerApi: _api, providerDoc: _doc, providerEnv: _env, ...modelData } = model
  const jsonContent = JSON.stringify(modelData, null, 2)
  const jsonOutput = `"${model.id}": ${jsonContent}`
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <ModelLogo model={model} className="size-12 rounded" />
            <div>
              <SheetTitle>{model.name}</SheetTitle>
              <SheetDescription>{model.providerName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="size-4" /> {t('detail.basicInfo')}
            </h4>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.modelId')} value={model.id} mono />
              <DetailRow label={t('detail.family')} value={model.family} />
              <DetailRow label={t('detail.openWeights')} value={model.open_weights ? t('detail.yes') : t('detail.no')} />
              <DetailRow label={t('detail.temperature')} value={model.temperature ? t('detail.supported') : t('detail.notSupported')} />
            </div>
          </div>
          
          {/* Dates */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Calendar className="size-4" /> {t('detail.dates')}
            </h4>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.releaseDate')} value={formatDate(model.release_date)} />
              <DetailRow label={t('detail.lastUpdated')} value={formatDate(model.last_updated)} />
              <DetailRow label={t('detail.knowledgeCutoff')} value={formatDate(model.knowledge)} />
            </div>
          </div>
          
          {/* Capabilities */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="size-4" /> {t('detail.capabilities')}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {CAPABILITIES.map(({ key, icon: Icon }) => (
                <div 
                  key={key} 
                  className={`flex items-center gap-2 text-sm p-2 rounded-lg ${model[key] ? 'bg-secondary' : 'bg-muted/30 opacity-50'}`}
                >
                  <Icon className="size-4" />
                  <span>{t(`capabilities.${key}`)}</span>
                  {model[key] && <Check className="size-3 ml-auto text-green-500" />}
                </div>
              ))}
            </div>
            {model.interleaved && (
              <div className="mt-2 text-xs text-muted-foreground">
                {t('detail.interleaved')}: <code className="bg-muted px-1 rounded">{model.interleaved.field}</code>
              </div>
            )}
          </div>
          
          {/* Modalities */}
          {model.modalities && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t('detail.modalities')}</h4>
              <div className="bg-muted/30 rounded-lg px-3">
                <DetailRow 
                  label={t('detail.input')} 
                  value={model.modalities.input?.join(', ') || '-'} 
                />
                <DetailRow 
                  label={t('card.output')} 
                  value={model.modalities.output?.join(', ') || '-'} 
                />
              </div>
            </div>
          )}
          
          {/* Limits */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('detail.tokenLimits')}</h4>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.contextWindow')} value={formatTokens(model.limit?.context ?? 0)} />
              <DetailRow label={t('detail.maxOutput')} value={formatTokens(model.limit?.output ?? 0)} />
            </div>
          </div>
          
          {/* Pricing */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('detail.pricing')}</h4>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.input')} value={formatCost(model.cost?.input ?? 0)} />
              <DetailRow label={t('card.output')} value={formatCost(model.cost?.output ?? 0)} />
              {model.cost?.cache_read !== undefined && (
                <DetailRow label={t('detail.cacheRead')} value={formatCost(model.cost.cache_read)} />
              )}
              {model.cost?.cache_write !== undefined && (
                <DetailRow label={t('detail.cacheWrite')} value={formatCost(model.cost.cache_write)} />
              )}
            </div>
          </div>
          
          {/* Provider Info */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Package className="size-4" /> {t('detail.provider')}
            </h4>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.name')} value={model.providerName} />
              <DetailRow label={t('detail.npmPackage')} value={model.providerNpm} mono />
              {model.providerApi && (
                <DetailRow label={t('detail.apiEndpoint')} value={model.providerApi} mono />
              )}
              {model.providerEnv && model.providerEnv.length > 0 && (
                <DetailRow label={t('detail.envVariables')} value={model.providerEnv.join(', ')} mono />
              )}
            </div>
            {model.providerDoc && (
              <a 
                href={model.providerDoc} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="size-3" /> {t('detail.documentation')}
              </a>
            )}
          </div>
          
          {/* Raw JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">{t('detail.rawJson')}</h4>
              <Button variant="outline" size="sm" onClick={handleCopyJson}>
                {copied ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                {copied ? t('common.copied') : t('common.copy')}
              </Button>
            </div>
            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
              {jsonOutput}
            </pre>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ModelCard({ 
  model, 
  onCopy,
  onViewDetails 
}: { 
  model: FlattenedModel
  onCopy: (model: FlattenedModel) => void
  onViewDetails: (model: FlattenedModel) => void
}) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [npmCopied, setNpmCopied] = useState(false)
  const [idCopied, setIdCopied] = useState(false)
  
  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const { providerId: _p, providerName: _pn, providerNpm: _npm, providerApi: _api, providerDoc: _doc, providerEnv: _env, ...modelData } = model
    const jsonContent = JSON.stringify(modelData, null, 2)
    const output = `"${model.id}": ${jsonContent}`
    navigator.clipboard.writeText(output)
    setCopied(true)
    onCopy(model)
    setTimeout(() => setCopied(false), 2000)
  }, [model, onCopy])
  
  const handleNpmCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (model.providerNpm) {
      navigator.clipboard.writeText(model.providerNpm)
      setNpmCopied(true)
      setTimeout(() => setNpmCopied(false), 2000)
    }
  }, [model.providerNpm])
  
  const handleIdCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(model.id)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 2000)
  }, [model.id])
  
  return (
    <Card 
      className="group hover:border-primary/50 transition-colors cursor-pointer min-w-0"
      onClick={() => onViewDetails(model)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <ModelLogo model={model} className="size-10 rounded shrink-0" />
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate">{model.name}</CardTitle>
            <CardDescription className="text-xs mt-1 flex items-center gap-1">
              <span>{model.providerName}</span>
              {model.providerNpm && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleNpmCopy}
                      className="inline-flex items-center hover:text-foreground transition-colors"
                    >
                      {npmCopied ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Package className="size-3" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{model.providerNpm}</code>
                      <span className="text-muted-foreground text-xs">{t('common.clickToCopy')}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              {model.family && <span>• {model.family}</span>}
            </CardDescription>
          </div>
          <CardAction>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8" 
                  onClick={handleCopy}
                >
                  {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('card.copyModelJson')}</TooltipContent>
            </Tooltip>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Capabilities - Icon only with tooltips */}
        <div className="flex items-center gap-2">
          {CAPABILITIES.map(({ key, icon: Icon }) => {
            const isEnabled = model[key]
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div className={`p-1.5 rounded ${isEnabled ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground/30'}`}>
                    <Icon className="size-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t(`capabilities.${key}`)}{isEnabled ? '' : ` ${t('capabilities.notSupported')}`}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
        
        {/* Modalities */}
        {model.modalities && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {model.modalities.input && model.modalities.input.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{t('card.in')}:</span>
                {model.modalities.input.map((m) => {
                  const Icon = getModalityIcon(m)
                  return (
                    <Tooltip key={m}>
                      <TooltipTrigger><Icon className="size-3.5" /></TooltipTrigger>
                      <TooltipContent>{m}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            )}
            {model.modalities.output && model.modalities.output.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{t('card.out')}:</span>
                {model.modalities.output.map((m) => {
                  const Icon = getModalityIcon(m)
                  return (
                    <Tooltip key={m}>
                      <TooltipTrigger><Icon className="size-3.5" /></TooltipTrigger>
                      <TooltipContent>{m}</TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        {/* Context & Cost */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground">{t('card.context')}</div>
            <div className="font-medium">{formatTokens(model.limit?.context ?? 0)}</div>
          </div>
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground">{t('card.output')}</div>
            <div className="font-medium">{formatTokens(model.limit?.output ?? 0)}</div>
          </div>
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground">{t('card.inputCost')}</div>
            <div className="font-medium">{formatCost(model.cost?.input ?? 0)}/1K</div>
          </div>
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground">{t('card.outputCost')}</div>
            <div className="font-medium">{formatCost(model.cost?.output ?? 0)}/1K</div>
          </div>
        </div>
        
        {/* Model ID & Dates */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                type="button"
                onClick={handleIdCopy}
                className="font-mono min-w-0 flex-1 truncate hover:text-foreground transition-colors flex items-center gap-1"
              >
                {idCopied ? <Check className="size-3 text-green-500 shrink-0" /> : <Copy className="size-3 shrink-0" />}
                <span className="truncate">{model.id}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>{t('card.copyModelId')}</TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-3">
            {model.release_date && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Rocket className="size-3" />
                    <span className="hidden sm:inline">{model.release_date}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('card.releaseDate')}</TooltipContent>
              </Tooltip>
            )}
            {model.last_updated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="size-3" />
                    <span className="hidden sm:inline">{model.last_updated}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t('card.lastUpdated')}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []
    const showPages = 5
    
    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      
      if (currentPage > 3) pages.push('ellipsis-start')
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) pages.push(i)
      
      if (currentPage < totalPages - 2) pages.push('ellipsis-end')
      
      pages.push(totalPages)
    }
    
    return pages
  }
  
  if (totalPages <= 1) return null
  
  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <Button
        variant="outline"
        size="icon"
        className="size-11 sm:size-9"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="size-4" />
      </Button>
      
      {getVisiblePages().map((page) => (
        page === 'ellipsis-start' || page === 'ellipsis-end' ? (
          <span key={page} className="px-2 text-muted-foreground">...</span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            className="size-11 sm:size-9"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        className="size-11 sm:size-9"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

function MobileFilterSheet({
  open,
  onOpenChange,
  selectedProvider,
  onProviderChange,
  providers,
  sortBy,
  onSortChange,
  selectedCapabilities,
  onCapabilityToggle,
  resultCount,
  onReset,
  hasActiveFilters,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedProvider: string
  onProviderChange: (provider: string) => void
  providers: { id: string; name: string }[]
  sortBy: string
  onSortChange: (sort: string) => void
  selectedCapabilities: CapabilityKey[]
  onCapabilityToggle: (cap: CapabilityKey) => void
  resultCount: number
  onReset: () => void
  hasActiveFilters: boolean
}) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl px-0 flex flex-col">
        <SheetHeader className="px-6 pb-4 border-b shrink-0">
          <SheetTitle>{t('filter.title', 'Filters')}</SheetTitle>
          <SheetDescription>{t('filter.description', 'Refine your model search')}</SheetDescription>
        </SheetHeader>
        
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8">
          <div className="space-y-3">
            <div className="text-sm font-medium">{t('filter.provider', 'Provider')}</div>
            <Select value={selectedProvider} onValueChange={onProviderChange}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder={t('filter.allProviders')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="h-10">{t('filter.allProviders')}</SelectItem>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="h-10">
                    <div className="flex items-center gap-2">
                      <ProviderLogo providerId={p.id} className="size-5" />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">{t('filter.sortBy', 'Sort By')}</div>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder={t('filter.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastUpdated" className="h-10">{t('sort.lastUpdated')}</SelectItem>
                <SelectItem value="releaseDate" className="h-10">{t('sort.releaseDate')}</SelectItem>
                <SelectItem value="name" className="h-10">{t('sort.name')}</SelectItem>
                <SelectItem value="nameDesc" className="h-10">{t('sort.nameDesc')}</SelectItem>
                <SelectItem value="contextSize" className="h-10">{t('sort.contextSize')}</SelectItem>
                <SelectItem value="inputCost" className="h-10">{t('sort.inputCost')}</SelectItem>
                <SelectItem value="inputCostDesc" className="h-10">{t('sort.inputCostDesc')}</SelectItem>
                <SelectItem value="outputCost" className="h-10">{t('sort.outputCost')}</SelectItem>
                <SelectItem value="outputCostDesc" className="h-10">{t('sort.outputCostDesc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">{t('detail.capabilities', 'Capabilities')}</div>
            <div className="grid grid-cols-1 gap-3">
              {CAPABILITIES.map(({ key, icon: Icon }) => {
                const isSelected = selectedCapabilities.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onCapabilityToggle(key)}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="size-5" />
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {t(`capabilities.${key}`)}
                      </span>
                    </div>
                    {isSelected && <Check className="size-5 text-primary" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-4 bg-background border-t shrink-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              onClick={onReset}
              disabled={!hasActiveFilters}
            >
              {t('common.reset')}
            </Button>
            <Button
              type="button"
              className="h-12 flex-1 text-base"
              onClick={() => onOpenChange(false)}
            >
              {t('filter.showResults', { count: resultCount })}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function App() {
  const { t, i18n } = useTranslation()

  const initialUrlState = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_URL_STATE
    return parseUrlStateFromSearch(window.location.search)
  }, [])

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Theme
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })
  
  // Filters
  const [search, setSearch] = useState(() => initialUrlState.search)
  const [selectedProvider, setSelectedProvider] = useState<string>(() => initialUrlState.provider)
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityKey[]>(() => initialUrlState.caps)
  const [sortBy, setSortBy] = useState<string>(() => initialUrlState.sortBy)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(() => initialUrlState.page)
  
  // Detail sheet
  const [selectedModel, setSelectedModel] = useState<FlattenedModel | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [requestedModelId, setRequestedModelId] = useState<string | null>(() => initialUrlState.modelId)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const skipNextUrlWriteRef = useRef(false)
  const lastUrlStateRef = useRef<UrlState | null>(null)
  
  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])
  
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev)
  }, [])

  const focusSearch = useCallback(() => {
    const el = searchInputRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [])
  
  // Fetch data with session cache
  useEffect(() => {
    const cached = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (cached) {
      try {
        setData(JSON.parse(cached))
        setLoading(false)
        return
      } catch {
        sessionStorage.removeItem(SESSION_CACHE_KEY)
      }
    }
    
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch data')
        return res.json()
      })
      .then((json) => {
        try {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(json))
        } catch {
          // Ignore quota errors
        }
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])
  
  const providers = useMemo(() => {
    if (!data) return []
    return extractProviders(data)
  }, [data])

  useEffect(() => {
    if (selectedProvider === 'all') return
    const exists = providers.some((p) => p.id === selectedProvider)
    if (!exists) setSelectedProvider('all')
  }, [providers, selectedProvider])
  
  const allModels = useMemo(() => {
    if (!data) return []
    return flattenModels(data)
  }, [data])

  useEffect(() => {
    if (!requestedModelId) return
    const found = allModels.find((m) => m.id === requestedModelId) || null
    if (found) {
      setSelectedModel(found)
      setSheetOpen(true)
    }
    setRequestedModelId(null)
  }, [allModels, requestedModelId])
  
  const filteredModels = useMemo(() => {
    let result = allModels.filter((model) => {
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch = 
          model.name.toLowerCase().includes(searchLower) ||
          model.id.toLowerCase().includes(searchLower) ||
          (model.family?.toLowerCase().includes(searchLower) ?? false) ||
          model.providerName.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      if (selectedProvider !== 'all' && model.providerId !== selectedProvider) {
        return false
      }
      
      if (selectedCapabilities.length > 0) {
        const hasAllCapabilities = selectedCapabilities.every((cap) => model[cap])
        if (!hasAllCapabilities) return false
      }
      
      return true
    })
    
    result.sort((a, b) => {
      switch (sortBy) {
        case 'lastUpdated':
          return (b.last_updated || '').localeCompare(a.last_updated || '')
        case 'releaseDate':
          return (b.release_date || '').localeCompare(a.release_date || '')
        case 'name':
          return a.name.localeCompare(b.name)
        case 'nameDesc':
          return b.name.localeCompare(a.name)
        case 'contextSize':
          return (b.limit?.context ?? 0) - (a.limit?.context ?? 0)
        case 'inputCost':
          return (a.cost?.input ?? Infinity) - (b.cost?.input ?? Infinity)
        case 'inputCostDesc':
          return (b.cost?.input ?? 0) - (a.cost?.input ?? 0)
        case 'outputCost':
          return (a.cost?.output ?? Infinity) - (b.cost?.output ?? Infinity)
        case 'outputCostDesc':
          return (b.cost?.output ?? 0) - (a.cost?.output ?? 0)
        default:
          return 0
      }
    })
    
    return result
  }, [allModels, search, selectedProvider, selectedCapabilities, sortBy])

  const totalPages = Math.ceil(filteredModels.length / PAGE_SIZE)
  
  useEffect(() => {
    if (totalPages <= 1) {
      if (currentPage !== 1) setCurrentPage(1)
      return
    }
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])
  
  const paginatedModels = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredModels.slice(start, start + PAGE_SIZE)
  }, [filteredModels, currentPage])
  
  const toggleCapability = useCallback((cap: CapabilityKey) => {
    setCurrentPage(1)
    setSelectedCapabilities((prev) =>
      prev.includes(cap)
        ? prev.filter((c) => c !== cap)
        : [...prev, cap]
    )
  }, [])

  const handleProviderChange = useCallback((provider: string) => {
    setSelectedProvider(provider)
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((nextSort: string) => {
    setSortBy(nextSort)
    setCurrentPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setSelectedProvider('all')
    setSelectedCapabilities([])
    setSortBy('lastUpdated')
    setCurrentPage(1)
  }, [])

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedCapabilities.length > 0 ||
    selectedProvider !== 'all' ||
    sortBy !== 'lastUpdated'
  
  const handleCopy = useCallback((_model: FlattenedModel) => {
    // Could add toast notification here
  }, [])
  
  const handleViewDetails = useCallback((model: FlattenedModel) => {
    setSelectedModel(model)
    setSheetOpen(true)
  }, [])

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setSelectedModel(null)
      setRequestedModelId(null)
    }
  }, [])
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      skipNextUrlWriteRef.current = true
      const next = parseUrlStateFromSearch(window.location.search)
      setSearch(next.search)
      setSelectedProvider(next.provider)
      setSelectedCapabilities(next.caps)
      setSortBy(next.sortBy)
      setCurrentPage(next.page)
      setRequestedModelId(next.modelId)

      if (!next.modelId) {
        setSelectedModel(null)
        setSheetOpen(false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (skipNextUrlWriteRef.current) {
      skipNextUrlWriteRef.current = false
      lastUrlStateRef.current = {
        search,
        provider: selectedProvider,
        caps: selectedCapabilities,
        sortBy,
        page: currentPage,
        modelId: sheetOpen && selectedModel ? selectedModel.id : null,
      }
      return
    }

    const capsInStableOrder = CAPABILITIES
      .map((c) => c.key)
      .filter((key) => selectedCapabilities.includes(key))

    const nextState: UrlState = {
      search,
      provider: selectedProvider,
      caps: capsInStableOrder,
      sortBy,
      page: currentPage,
      modelId: sheetOpen && selectedModel ? selectedModel.id : null,
    }

    const nextSearch = buildUrlSearchFromState(nextState)
    const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
    if (nextUrl === currentUrl) {
      lastUrlStateRef.current = nextState
      return
    }

    const prev = lastUrlStateRef.current
    const shouldReplace = !prev || prev.search !== nextState.search
    if (shouldReplace) {
      window.history.replaceState(null, '', nextUrl)
    } else {
      window.history.pushState(null, '', nextUrl)
    }

    lastUrlStateRef.current = nextState
  }, [
    search,
    selectedProvider,
    selectedCapabilities,
    sortBy,
    currentPage,
    sheetOpen,
    selectedModel,
  ])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return

      const key = e.key
      const metaOrCtrl = e.metaKey || e.ctrlKey
      const isSearchTarget = e.target === searchInputRef.current

      if (metaOrCtrl && key.toLowerCase() === 'k') {
        e.preventDefault()
        focusSearch()
        return
      }

      if (key === '/' && !shouldIgnoreKeydownTarget(e.target)) {
        e.preventDefault()
        focusSearch()
        return
      }

      if (key === 'Escape') {
        if (sheetOpen) {
          handleSheetOpenChange(false)
          return
        }
        const canHandleEscape = isSearchTarget || !shouldIgnoreKeydownTarget(e.target)
        if (search && canHandleEscape) {
          handleSearchChange('')
          focusSearch()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusSearch, handleSearchChange, handleSheetOpenChange, search, sheetOpen])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">{t('common.error')}: {error}</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('header.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('header.subtitle', { modelCount: allModels.length, providerCount: providers.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={i18n.language} onValueChange={(lang) => {
              i18n.changeLanguage(lang)
              localStorage.setItem('language', lang)
            }}>
              <SelectTrigger className="w-32">
                <Languages className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('language.en')}</SelectItem>
                <SelectItem value="zh">{t('language.zh')}</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleTheme}>
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isDark ? t('common.lightMode') : t('common.darkMode')}</TooltipContent>
            </Tooltip>
          </div>
        </header>
        
        {/* Filters */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur mb-6 -mx-4 px-4 border-b pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('filter.searchPlaceholder')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-11 sm:h-9"
                ref={searchInputRef}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 sm:hidden size-11 relative"
              onClick={() => setMobileFiltersOpen(true)}
              aria-label={t('filter.title', 'Filters')}
            >
              <Filter className="size-4" />
              {hasActiveFilters && (
                <span
                  className="absolute -top-1 -right-1 size-2.5 bg-primary rounded-full border-2 border-background"
                  aria-hidden="true"
                />
              )}
            </Button>
            
            <div className="hidden sm:flex sm:items-center sm:gap-3">
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('filter.allProviders')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filter.allProviders')}</SelectItem>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <ProviderLogo providerId={p.id} className="size-4" />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sort Select */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={t('filter.sortBy')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastUpdated">{t('sort.lastUpdated')}</SelectItem>
                  <SelectItem value="releaseDate">{t('sort.releaseDate')}</SelectItem>
                  <SelectItem value="name">{t('sort.name')}</SelectItem>
                  <SelectItem value="nameDesc">{t('sort.nameDesc')}</SelectItem>
                  <SelectItem value="contextSize">{t('sort.contextSize')}</SelectItem>
                  <SelectItem value="inputCost">{t('sort.inputCost')}</SelectItem>
                  <SelectItem value="inputCostDesc">{t('sort.inputCostDesc')}</SelectItem>
                  <SelectItem value="outputCost">{t('sort.outputCost')}</SelectItem>
                  <SelectItem value="outputCostDesc">{t('sort.outputCostDesc')}</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Capabilities Filter */}
              <div className="flex items-center gap-3">
                {CAPABILITIES.map(({ key, icon: Icon }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <Checkbox
                      checked={selectedCapabilities.includes(key)}
                      onCheckedChange={() => toggleCapability(key)}
                      aria-label={t(`capabilities.${key}`)}
                    />
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => toggleCapability(key)}
                      className="text-sm hidden lg:inline text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t(`capabilities.${key}`)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="text-sm text-muted-foreground mt-3">
            {t('filter.showingResults', { 
              start: filteredModels.length > 0 ? ((currentPage - 1) * PAGE_SIZE) + 1 : 0,
              end: Math.min(currentPage * PAGE_SIZE, filteredModels.length),
              total: filteredModels.length
            })}
          </div>
        </div>
        
        {/* Models Grid */}
        {filteredModels.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {t('filter.noResults')}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedModels.map((model) => (
                <ModelCard 
                  key={`${model.providerId}-${model.id}`} 
                  model={model} 
                  onCopy={handleCopy}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
      
      {/* Model Detail Sheet */}
      <ModelDetailSheet
        model={selectedModel}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />

      <MobileFilterSheet
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        selectedProvider={selectedProvider}
        onProviderChange={handleProviderChange}
        providers={providers}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        selectedCapabilities={selectedCapabilities}
        onCapabilityToggle={toggleCapability}
        resultCount={filteredModels.length}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  )
}
