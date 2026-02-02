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
import { Check } from 'lucide-react'
import type { CapabilityKey } from '@/types'
import { CAPABILITIES } from '@/constants'
import { ProviderLogo } from './ModelLogo'

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
