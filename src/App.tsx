import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Search,
  Moon,
  Sun,
  Languages,
  Filter
} from 'lucide-react'
import type { ApiResponse, FlattenedModel, CapabilityKey, UrlState } from '@/types'
import {
  API_URL,
  PAGE_SIZE,
  SESSION_CACHE_KEY,
  CAPABILITIES,
  DEFAULT_URL_STATE
} from '@/constants'
import {
  parseUrlStateFromSearch,
  buildUrlSearchFromState,
  shouldIgnoreKeydownTarget,
  flattenModels,
  extractProviders,
  getModalityIcon
} from '@/lib/utils'
import { ProviderLogo } from '@/components/ModelLogo'
import { ModelCard } from '@/components/ModelCard'
import { ModelDetailSheet } from '@/components/ModelDetailSheet'
import { Pagination } from '@/components/Pagination'
import { MobileFilterSheet } from '@/components/MobileFilterSheet'

export default function App() {
  const { t, i18n } = useTranslation()

  const initialUrlState = useMemo(() => {
    if (typeof window === 'undefined') return DEFAULT_URL_STATE
    return parseUrlStateFromSearch(window.location.search)
  }, [])

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const [search, setSearch] = useState(() => initialUrlState.search)
  const [selectedProvider, setSelectedProvider] = useState<string>(() => initialUrlState.provider)
  const [selectedCapabilities, setSelectedCapabilities] = useState<CapabilityKey[]>(() => initialUrlState.caps)
  const [selectedInputModality, setSelectedInputModality] = useState<string[]>(() => initialUrlState.inputModality)
  const [selectedOutputModality, setSelectedOutputModality] = useState<string[]>(() => initialUrlState.outputModality)
  const [sortBy, setSortBy] = useState<string>(() => initialUrlState.sortBy)

  const [currentPage, setCurrentPage] = useState(() => initialUrlState.page)

  const [selectedModel, setSelectedModel] = useState<FlattenedModel | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [requestedModelId, setRequestedModelId] = useState<string | null>(() => initialUrlState.modelId)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const skipNextUrlWriteRef = useRef(false)
  const lastUrlStateRef = useRef<UrlState | null>(null)

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

  const inputModalities = useMemo(() => {
    const items = new Set<string>()
    for (const model of allModels) {
      for (const modality of model.modalities?.input ?? []) {
        items.add(modality)
      }
    }
    return Array.from(items).sort((a, b) => a.localeCompare(b))
  }, [allModels])

  const outputModalities = useMemo(() => {
    const items = new Set<string>()
    for (const model of allModels) {
      for (const modality of model.modalities?.output ?? []) {
        items.add(modality)
      }
    }
    return Array.from(items).sort((a, b) => a.localeCompare(b))
  }, [allModels])

  useEffect(() => {
    const validInputs = inputModalities.filter(m => selectedInputModality.includes(m))
    if (validInputs.length !== selectedInputModality.length) {
      setSelectedInputModality(validInputs)
    }
  }, [inputModalities, selectedInputModality])

  useEffect(() => {
    const validOutputs = outputModalities.filter(m => selectedOutputModality.includes(m))
    if (validOutputs.length !== selectedOutputModality.length) {
      setSelectedOutputModality(validOutputs)
    }
  }, [outputModalities, selectedOutputModality])

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
    const result = allModels.filter((model) => {
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

      if (selectedInputModality.length > 0) {
        const supportsInput = selectedInputModality.every(m => model.modalities?.input?.includes(m))
        if (!supportsInput) return false
      }

      if (selectedOutputModality.length > 0) {
        const supportsOutput = selectedOutputModality.every(m => model.modalities?.output?.includes(m))
        if (!supportsOutput) return false
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
  }, [allModels, search, selectedProvider, selectedCapabilities, selectedInputModality, selectedOutputModality, sortBy])

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

  const handleInputModalityChange = useCallback((modality: string) => {
    setCurrentPage(1)
    setSelectedInputModality((prev) =>
      prev.includes(modality)
        ? prev.filter((m) => m !== modality)
        : [...prev, modality]
    )
  }, [])

  const handleOutputModalityChange = useCallback((modality: string) => {
    setCurrentPage(1)
    setSelectedOutputModality((prev) =>
      prev.includes(modality)
        ? prev.filter((m) => m !== modality)
        : [...prev, modality]
    )
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setSearch('')
    setSelectedProvider('all')
    setSelectedCapabilities([])
    setSelectedInputModality([])
    setSelectedOutputModality([])
    setSortBy('lastUpdated')
    setCurrentPage(1)
  }, [])

  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedCapabilities.length > 0 ||
    selectedProvider !== 'all' ||
    selectedInputModality.length > 0 ||
    selectedOutputModality.length > 0 ||
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
      setSelectedInputModality(next.inputModality)
      setSelectedOutputModality(next.outputModality)
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
        inputModality: selectedInputModality,
        outputModality: selectedOutputModality,
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
      inputModality: selectedInputModality,
      outputModality: selectedOutputModality,
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
    selectedInputModality,
    selectedOutputModality,
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

        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur mb-6 -mx-4 px-4 border-b pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 sm:py-4">
          <div className="flex items-center gap-2 sm:hidden">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('filter.searchPlaceholder')}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-11"
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
          </div>

          <div className="hidden sm:flex sm:flex-col sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('filter.searchPlaceholder')}
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-9"
                  ref={searchInputRef}
                />
              </div>

              <div className="flex items-center gap-3">
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
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pb-1">
              <span className="text-sm font-medium text-muted-foreground">{t('detail.capabilities')}:</span>
              {CAPABILITIES.map(({ key, icon: Icon }) => {
                const isSelected = selectedCapabilities.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCapability(key)}
                    aria-pressed={isSelected}
                    className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                      ${isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="size-3" aria-hidden="true" />
                    {t(`capabilities.${key}`)}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-start gap-4 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{t('filter.inputType')}:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {inputModalities.map((modality) => {
                      const Icon = getModalityIcon(modality)
                      const isSelected = selectedInputModality.includes(modality)
                      return (
                        <button
                          key={modality}
                          type="button"
                          onClick={() => handleInputModalityChange(modality)}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                            ${isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                            }
                          `}
                        >
                          <Icon className="size-3" />
                          {modality}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">{t('filter.outputType')}:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {outputModalities.map((modality) => {
                      const Icon = getModalityIcon(modality)
                      const isSelected = selectedOutputModality.includes(modality)
                      return (
                        <button
                          key={modality}
                          type="button"
                          onClick={() => handleOutputModalityChange(modality)}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                            ${isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                            }
                          `}
                        >
                          <Icon className="size-3" />
                          {modality}
                        </button>
                      )
                    })}
                  </div>
                </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mt-3">
            {t('filter.showingResults', {
              start: filteredModels.length > 0 ? ((currentPage - 1) * PAGE_SIZE) + 1 : 0,
              end: Math.min(currentPage * PAGE_SIZE, filteredModels.length),
              total: filteredModels.length
            })}
          </div>
        </div>

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
        selectedInputModality={selectedInputModality}
        selectedOutputModality={selectedOutputModality}
        onInputModalityChange={handleInputModalityChange}
        onOutputModalityChange={handleOutputModalityChange}
        inputModalities={inputModalities}
        outputModalities={outputModalities}
        resultCount={filteredModels.length}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  )
}
