import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Copy, Check, Package, Rocket, RefreshCw } from 'lucide-react'
import type { FlattenedModel } from '@/types'
import { CAPABILITIES } from '@/constants'
import { getModalityIcon, formatTokens, formatCost } from '@/lib/utils'
import { ModelLogo } from './ModelLogo'

export function ModelCard({ 
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
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">{model.name}</CardTitle>
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
            <div className="font-medium">{formatCost(model.cost?.input ?? 0)}/1M</div>
          </div>
          <div className="bg-muted/50 rounded px-2 py-1.5">
            <div className="text-muted-foreground">{t('card.outputCost')}</div>
            <div className="font-medium">{formatCost(model.cost?.output ?? 0)}/1M</div>
          </div>
        </div>
        
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
