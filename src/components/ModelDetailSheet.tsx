import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Copy, Check, Info, Calendar, Sparkles, Package, ExternalLink } from 'lucide-react'
import type { FlattenedModel } from '@/types'
import { CAPABILITIES } from '@/constants'
import { formatDate, formatTokens, formatCost } from '@/lib/utils'
import { ModelLogo } from './ModelLogo'
import { DetailRow } from './DetailRow'

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
          
          <div>
            <h4 className="text-sm font-medium mb-2">{t('detail.tokenLimits')}</h4>
            <div className="bg-muted/30 rounded-lg px-3">
              <DetailRow label={t('detail.contextWindow')} value={formatTokens(model.limit?.context ?? 0)} />
              <DetailRow label={t('detail.maxOutput')} value={formatTokens(model.limit?.output ?? 0)} />
            </div>
          </div>
          
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
