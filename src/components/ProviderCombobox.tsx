import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FamilyIcon, ProviderLogo } from './ModelLogo'

interface ComboboxOption {
  value: string
  label: string
  searchText: string
  icon?: ReactNode
}

function SearchableFilterCombobox({
  value,
  onValueChange,
  options,
  allLabel,
  searchPlaceholder,
  emptyLabel,
  className = '',
  triggerClassName = '',
}: {
  value: string
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  allLabel: string
  searchPlaceholder: string
  emptyLabel: string
  className?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options

    return options.filter((option) => option.searchText.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const chooseOption = useCallback((optionValue: string) => {
    onValueChange(optionValue)
    close()
  }, [close, onValueChange])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return
      close()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [close, open])

  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(timeout)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
          triggerClassName,
        )}
        onClick={() => setOpen((next) => !next)}
      >
        <span className="min-w-0 flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="truncate">{allLabel}</span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-64 rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    close()
                  }
                  if (event.key === 'Enter' && filteredOptions.length > 0) {
                    event.preventDefault()
                    chooseOption(filteredOptions[0].value)
                  }
                }}
                placeholder={searchPlaceholder}
                className="h-9 pl-8"
              />
            </div>
          </div>

          <div role="listbox" className="max-h-72 overflow-y-auto p-1">
            <button
              type="button"
              role="option"
              aria-selected={value === 'all'}
              className={cn(
                'flex h-9 w-full items-center rounded-sm px-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                value === 'all' && 'bg-accent text-accent-foreground',
              )}
              onClick={() => chooseOption('all')}
            >
              {allLabel}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className={cn(
                    'flex h-9 w-full items-center gap-2 rounded-sm px-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    value === option.value && 'bg-accent text-accent-foreground',
                  )}
                  onClick={() => chooseOption(option.value)}
                >
                  {option.icon}
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ProviderCombobox({
  value,
  onValueChange,
  providers,
  className = '',
  triggerClassName = '',
}: {
  value: string
  onValueChange: (provider: string) => void
  providers: { id: string; name: string }[]
  className?: string
  triggerClassName?: string
}) {
  const { t } = useTranslation()
  const options = useMemo(
    () => providers.map((provider) => ({
      value: provider.id,
      label: provider.name,
      searchText: `${provider.name} ${provider.id}`,
      icon: <ProviderLogo providerId={provider.id} className="size-4 shrink-0" />,
    })),
    [providers],
  )

  return (
    <SearchableFilterCombobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      allLabel={t('filter.allProviders')}
      searchPlaceholder={t('filter.searchProviders')}
      emptyLabel={t('filter.noProviders')}
      className={className}
      triggerClassName={triggerClassName}
    />
  )
}

export function FamilyCombobox({
  value,
  onValueChange,
  families,
  className = '',
  triggerClassName = '',
}: {
  value: string
  onValueChange: (family: string) => void
  families: string[]
  className?: string
  triggerClassName?: string
}) {
  const { t } = useTranslation()
  const options = useMemo(
    () => families.map((family) => ({
      value: family,
      label: family,
      searchText: family,
      icon: <FamilyIcon family={family} className="size-4 shrink-0" />,
    })),
    [families],
  )

  return (
    <SearchableFilterCombobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      allLabel={t('filter.allFamilies')}
      searchPlaceholder={t('filter.searchFamilies')}
      emptyLabel={t('filter.noFamilies')}
      className={className}
      triggerClassName={triggerClassName}
    />
  )
}
