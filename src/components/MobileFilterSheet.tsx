import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { CapabilityKey } from '@/types'
import { CAPABILITIES } from '@/constants'
import { ProviderLogo } from './ModelLogo'

import { getModalityIcon } from '@/lib/utils'

export function MobileFilterSheet({
  open,
  onOpenChange,
  selectedProvider,
  onProviderChange,
  providers,
  sortBy,
  onSortChange,
  selectedCapabilities,
  onCapabilityToggle,
  selectedInputModality,
  selectedOutputModality,
  onInputModalityChange,
  onOutputModalityChange,
  inputModalities,
  outputModalities,
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
  selectedInputModality: string[]
  selectedOutputModality: string[]
  onInputModalityChange: (modality: string) => void
  onOutputModalityChange: (modality: string) => void
  inputModalities: string[]
  outputModalities: string[]
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
            <div className="text-sm font-medium">{t('filter.inputType', 'Input')}</div>
            <div className="flex flex-wrap gap-2">
              {inputModalities.map((modality) => {
                const Icon = getModalityIcon(modality)
                const isSelected = selectedInputModality.includes(modality)
                return (
                  <button
                    key={modality}
                    type="button"
                    onClick={() => onInputModalityChange(modality)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="size-4" />
                    {modality}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">{t('filter.outputType', 'Output')}</div>
            <div className="flex flex-wrap gap-2">
              {outputModalities.map((modality) => {
                const Icon = getModalityIcon(modality)
                const isSelected = selectedOutputModality.includes(modality)
                return (
                  <button
                    key={modality}
                    type="button"
                    onClick={() => onOutputModalityChange(modality)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="size-4" />
                    {modality}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">{t('detail.capabilities', 'Capabilities')}</div>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map(({ key, icon: Icon }) => {
                const isSelected = selectedCapabilities.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onCapabilityToggle(key)}
                    aria-pressed={isSelected}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                      ${isSelected
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {t(`capabilities.${key}`)}
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
