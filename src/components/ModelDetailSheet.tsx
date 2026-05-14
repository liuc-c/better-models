import { useState, useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Copy,
  Check,
  Info,
  Calendar,
  Sparkles,
  Package,
  ExternalLink,
  SlidersHorizontal,
  Database,
} from 'lucide-react'
import type {
  FlattenedModel,
  ModelCostFields,
  ModelCostTier,
  ModelExperimentalMode,
  ModelProviderOverride,
} from '@/types'
import { CAPABILITIES } from '@/constants'
import { formatDate, formatTokens, formatCost, stringifyCompleteModelMetadata } from '@/lib/utils'
import { ModelFamilyIcon, ModelLogo } from './ModelLogo'
import { DetailRow } from './DetailRow'

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function hasEntries(value: object | undefined): boolean {
  return value !== undefined && Object.keys(value).length > 0
}

export function ModelDetailSheet({ 
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
    navigator.clipboard.writeText(stringifyCompleteModelMetadata(model))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [model])
  
  if (!model) return null

  const costLabels = { free: t('common.free'), unknown: t('common.unknown') }
  const formatModelCost = (cost: number | null | undefined) => formatCost(cost, costLabels)
  const jsonOutput = stringifyCompleteModelMetadata(model)
  const providerOverride = model.provider
  const experimentalModes = Object.entries(model.experimental?.modes ?? {})

  const renderCostRows = (cost: ModelCostFields | undefined, showUnknownBase = false) => (
    <>
      {(showUnknownBase || cost?.input !== undefined) && (
        <DetailRow label={t('detail.input')} value={formatModelCost(cost?.input)} />
      )}
      {(showUnknownBase || cost?.output !== undefined) && (
        <DetailRow label={t('card.output')} value={formatModelCost(cost?.output)} />
      )}
      {cost?.reasoning !== undefined && (
        <DetailRow label={t('detail.reasoningPrice')} value={formatModelCost(cost.reasoning)} />
      )}
      {cost?.cache_read !== undefined && (
        <DetailRow label={t('detail.cacheRead')} value={formatModelCost(cost.cache_read)} />
      )}
      {cost?.cache_write !== undefined && (
        <DetailRow label={t('detail.cacheWrite')} value={formatModelCost(cost.cache_write)} />
      )}
      {cost?.input_audio !== undefined && (
        <DetailRow label={t('detail.audioInput')} value={formatModelCost(cost.input_audio)} />
      )}
      {cost?.output_audio !== undefined && (
        <DetailRow label={t('detail.audioOutput')} value={formatModelCost(cost.output_audio)} />
      )}
    </>
  )

  const renderProviderOverrideRows = (provider: ModelProviderOverride) => (
    <>
      <DetailRow label={t('detail.npmPackage')} value={provider.npm} mono />
      <DetailRow label={t('detail.apiEndpoint')} value={provider.api} mono />
      <DetailRow label={t('detail.shape')} value={provider.shape} mono />
      {provider.body && (
        <div className="py-2 border-b border-border/50 last:border-0">
          <div className="text-muted-foreground text-sm mb-2">{t('detail.requestBody')}</div>
          <JsonBlock value={provider.body} />
        </div>
      )}
      {provider.headers && (
        <div className="py-2 border-b border-border/50 last:border-0">
          <div className="text-muted-foreground text-sm mb-2">{t('detail.requestHeaders')}</div>
          <JsonBlock value={provider.headers} />
        </div>
      )}
    </>
  )

  const renderPriceTier = (tier: ModelCostTier, index: number) => (
    <div key={index} className="rounded-lg border border-border/60 px-3 py-2">
      <div className="text-xs font-medium mb-1">
        {t('detail.priceTier', { number: index + 1 })}
      </div>
      <DetailRow label={t('detail.tierType')} value={tier.tier?.type} />
      <DetailRow label={t('detail.tierSize')} value={formatTokens(tier.tier?.size)} />
      {renderCostRows(tier)}
    </div>
  )

  const renderExperimentalMode = ([modeName, mode]: [string, ModelExperimentalMode]) => (
    <div key={modeName} className="rounded-lg border border-border/60 px-3 py-2 space-y-3">
      <div className="text-xs font-medium">
        {t('detail.mode')}: <code className="bg-muted px-1 rounded">{modeName}</code>
      </div>
      {mode.cost && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">{t('detail.costOverrides')}</div>
          <div className="bg-muted/30 rounded-lg px-3">
            {renderCostRows(mode.cost)}
          </div>
        </div>
      )}
      {mode.provider && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">{t('detail.providerSettings')}</div>
          <div className="bg-muted/30 rounded-lg px-3">
            {renderProviderOverrideRows(mode.provider)}
          </div>
        </div>
      )}
    </div>
  )
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <ModelLogo model={model} className="size-12 rounded shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="min-w-0 break-words">
                  <span className="inline-flex min-w-0 items-center gap-2 align-bottom">
                    <ModelFamilyIcon model={model} className="size-[1em] shrink-0" />
                    <span>{model.name}</span>
                  </span>
                </SheetTitle>
                {model.status && (
                  <Badge 
                    variant={model.status === 'deprecated' ? 'destructive' : 'secondary'}
                    className={`
                      h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold
                      ${model.status === 'alpha' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/25 border-orange-200 dark:border-orange-800' : ''}
                      ${model.status === 'beta' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 border-blue-200 dark:border-blue-800' : ''}
                      ${model.status === 'deprecated' ? 'opacity-80' : ''}
                    `}
                  >
                    {t(`card.status.${model.status}`)}
                  </Badge>
                )}
              </div>
              <SheetDescription>{model.providerName}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="space-y-6">
          <DetailSection title={t('detail.basicInfo')} icon={<Info className="size-4" />}>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.name')} value={model.name} />
              <DetailRow label={t('detail.modelId')} value={model.id} mono />
              <DetailRow label={t('detail.family')} value={model.family} />
              <DetailRow label={t('detail.status')} value={model.status ? t(`card.status.${model.status}`) : undefined} />
              <DetailRow label={t('detail.openWeights')} value={model.open_weights ? t('detail.yes') : t('detail.no')} />
              <DetailRow label={t('detail.temperature')} value={model.temperature ? t('detail.supported') : t('detail.notSupported')} />
            </div>
          </DetailSection>
          
          <DetailSection title={t('detail.dates')} icon={<Calendar className="size-4" />}>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.releaseDate')} value={formatDate(model.release_date)} />
              <DetailRow label={t('detail.lastUpdated')} value={formatDate(model.last_updated)} />
              <DetailRow label={t('detail.knowledgeCutoff')} value={formatDate(model.knowledge)} />
            </div>
          </DetailSection>
          
          <DetailSection title={t('detail.capabilities')} icon={<Sparkles className="size-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
            <div className="bg-muted/30 rounded-lg px-3 mt-2">
              <DetailRow label={t('detail.interleaved')} value={
                model.interleaved
                  ? model.interleaved === true
                    ? t('detail.supported')
                    : model.interleaved.field
                  : t('detail.notSupported')
              } />
            </div>
          </DetailSection>
          
          {model.modalities && (
            <DetailSection title={t('detail.modalities')}>
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
            </DetailSection>
          )}
          
          <DetailSection title={t('detail.tokenLimits')}>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.contextWindow')} value={formatTokens(model.limit?.context)} />
              <DetailRow label={t('detail.maxInput')} value={formatTokens(model.limit?.input)} />
              <DetailRow label={t('detail.maxOutput')} value={formatTokens(model.limit?.output)} />
            </div>
          </DetailSection>
          
          <DetailSection title={t('detail.pricing')}>
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg px-3">
                {renderCostRows(model.cost, true)}
              </div>
              {model.cost?.context_over_200k && (
                <div className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="text-xs font-medium mb-1">{t('detail.contextOver200k')}</div>
                  <div className="bg-muted/30 rounded-lg px-3">
                    {renderCostRows(model.cost.context_over_200k)}
                  </div>
                </div>
              )}
              {model.cost?.tiers && model.cost.tiers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">{t('detail.tieredPricing')}</div>
                  {model.cost.tiers.map(renderPriceTier)}
                </div>
              )}
            </div>
          </DetailSection>
          
          <DetailSection title={t('detail.provider')} icon={<Package className="size-4" />}>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.name')} value={model.providerName} />
              <DetailRow label={t('detail.npmPackage')} value={model.providerNpm} mono />
              <DetailRow label={t('detail.apiEndpoint')} value={model.providerApi} mono />
              <DetailRow label={t('detail.envVariables')} value={model.providerEnv?.join(', ')} mono />
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
          </DetailSection>

          {providerOverride && hasEntries(providerOverride) && (
            <DetailSection title={t('detail.providerOverride')} icon={<SlidersHorizontal className="size-4" />}>
              <div className="bg-muted/30 rounded-lg px-3">
                {renderProviderOverrideRows(providerOverride)}
              </div>
            </DetailSection>
          )}

          {experimentalModes.length > 0 && (
            <DetailSection title={t('detail.experimental')} icon={<Database className="size-4" />}>
              <div className="space-y-2">
                {experimentalModes.map(renderExperimentalMode)}
              </div>
            </DetailSection>
          )}
          
          <DetailSection title={t('detail.rawJson')}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-xs text-muted-foreground">{t('detail.completeRawJson')}</div>
              <Button variant="outline" size="sm" onClick={handleCopyJson}>
                {copied ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                {copied ? t('common.copied') : t('common.copy')}
              </Button>
            </div>
            <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
              {jsonOutput}
            </pre>
          </DetailSection>
        </div>
      </SheetContent>
    </Sheet>
  )
}
