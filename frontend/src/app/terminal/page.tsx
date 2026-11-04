'use client';

import { BrandLogo } from '@/components/brand-logo';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchMarketSummary,
  fetchStocks,
  triggerMarketSync,
} from '@/lib/api';
import {
  B3_STANDARD_CATEGORIES,
  FilterParams,
  MarketSummary,
  RankingPreset,
  RankingPresetEnum,
  StockItem,
} from '@/lib/schemas';
import { MarketSummaryCards } from '@/components/market-summary-cards';
import { StocksRankingTable } from '@/components/stocks-ranking-table';
import { StockDetailDialog } from '@/components/stock-detail-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

function formatSyncAge(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(diffMs)) return '';
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function extractTickerCount(source: string): number | null {
  const match = source.match(/(\d[\d.]*)\s*tickers?/i);
  return match ? Number(match[1].replace(/\./g, '')) : null;
}

export default function TerminalPage() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [sectors, setSectors] = useState<string[]>([...B3_STANDARD_CATEGORIES]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [activeHeaderPreset, setActiveHeaderPreset] = useState<
    'todas' | 'maiores_receitas' | 'maiores_valor_mercado'
  >('todas');

  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    sector: 'ALL',
    sectors: [],
    thematicCategory: 'ALL',
    rankingPreset: 'valor_mercado',
    variationPeriod: '24h',
    onlyPassedCut: false,
    onlySmallCaps: false,
    oneStockPerCompany: false,
    onlyTop100Popular: false,
    minScore: 0,
    sortBy: 'marketCap',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });

  const loadData = useCallback(async (currentFilters: FilterParams) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [summaryResult, stocksResult] = await Promise.allSettled([
        fetchMarketSummary(),
        fetchStocks(currentFilters),
      ]);

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      }

      if (stocksResult.status === 'fulfilled') {
        const stocksRes = stocksResult.value;
        setStocks(stocksRes.items);
        setTotal(stocksRes.total);
        setTotalPages(stocksRes.totalPages);
        if (stocksRes.sectors && stocksRes.sectors.length > 0) {
          setSectors(stocksRes.sectors);
        }
      } else if (stocksResult.status === 'rejected') {
        setLoadError(
          'O servidor demorou para responder (comum na primeira conexão no plano gratuito do Render). Clique abaixo para tentar novamente.',
        );
      }
    } catch {
      setLoadError('Erro ao carregar dados do terminal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    const headerPresetParam = params.get('headerPreset');
    const presetParam = params.get('preset');

    if (
      headerPresetParam === 'todas' ||
      headerPresetParam === 'maiores_receitas' ||
      headerPresetParam === 'maiores_valor_mercado'
    ) {
      setActiveHeaderPreset(headerPresetParam);
      if (headerPresetParam === 'maiores_receitas') {
        setFilters((prev) => ({
          ...prev,
          search: searchParam || prev.search,
          rankingPreset: 'maiores_receitas',
          sortBy: 'revenue',
          sortOrder: 'desc',
          page: 1,
        }));
        return;
      }
      setFilters((prev) => ({
        ...prev,
        search: searchParam || prev.search,
        rankingPreset: 'valor_mercado',
        sortBy: 'marketCap',
        sortOrder: 'desc',
        page: 1,
      }));
      return;
    }

    if (presetParam) {
      const parsed = RankingPresetEnum.safeParse(presetParam);
      if (parsed.success) {
        const preset: RankingPreset = parsed.data;
        if (preset === 'maiores_receitas') {
          setActiveHeaderPreset('maiores_receitas');
        } else if (preset === 'valor_mercado') {
          setActiveHeaderPreset('maiores_valor_mercado');
        }
        const sortFieldMap: Record<RankingPreset, FilterParams['sortBy']> = {
          valor_mercado: 'marketCap',
          dy: 'dy',
          graham: 'grahamMargin',
          margem_liquida: 'netMargin',
          buy_and_hold: 'scoreTotal',
          mais_queridas: 'dailyLiquidity',
          bazin: 'bazinMargin',
          maiores_receitas: 'revenue',
          maiores_lucros: 'netIncome',
          maiores_altas: 'change24h',
          maiores_baixas: 'change24h',
        };
        setFilters((prev) => ({
          ...prev,
          search: searchParam || prev.search,
          rankingPreset: preset,
          sortBy: sortFieldMap[preset],
          sortOrder: preset === 'maiores_baixas' ? 'asc' : 'desc',
          page: 1,
        }));
        return;
      }
    }

    if (searchParam) {
      setFilters((prev) => ({
        ...prev,
        search: searchParam,
        page: 1,
      }));
    }
  }, []);

  useEffect(() => {
    loadData(filters);
  }, [filters, loadData]);

  const handleUpdateFilters = (partial: Partial<FilterParams>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleHeaderPreset = (
    preset: 'todas' | 'maiores_receitas' | 'maiores_valor_mercado',
  ) => {
    setActiveHeaderPreset(preset);
    if (preset === 'todas') {
      setFilters((prev) => ({
        ...prev,
        rankingPreset: 'valor_mercado',
        onlyTop100Popular: false,
        sortBy: 'marketCap',
        sortOrder: 'desc',
        page: 1,
      }));
    } else if (preset === 'maiores_receitas') {
      setFilters((prev) => ({
        ...prev,
        rankingPreset: 'maiores_receitas',
        onlyTop100Popular: false,
        sortBy: 'revenue',
        sortOrder: 'desc',
        page: 1,
      }));
    } else if (preset === 'maiores_valor_mercado') {
      setFilters((prev) => ({
        ...prev,
        rankingPreset: 'valor_mercado',
        onlyTop100Popular: false,
        sortBy: 'marketCap',
        sortOrder: 'desc',
        page: 1,
      }));
    }
  };

  const handleToggleCategory = (category: string) => {
    setFilters((prev) => {
      const exists = prev.sectors.includes(category);
      const nextSectors = exists
        ? prev.sectors.filter((item) => item !== category)
        : [...prev.sectors, category];
      return {
        ...prev,
        sector: 'ALL',
        sectors: nextSectors,
        page: 1,
      };
    });
  };

  const handleClearCategories = () => {
    setFilters((prev) => ({
      ...prev,
      sector: 'ALL',
      sectors: [],
      page: 1,
    }));
  };

  const handleSelectStock = (stock: StockItem) => {
    setSelectedStock(stock);
    setModalOpen(true);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerMarketSync();
      await loadData(filters);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist-950 text-stone-100 antialiased font-sans">
      <header className="sticky top-0 z-40 border-b border-mist-800 bg-mist-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <BrandLogo />

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-lg px-3 text-xs font-semibold text-stone-400 hover:bg-mist-900 hover:text-stone-100 gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Tela Inicial
                </Button>
              </Link>

              <div className="flex h-9 items-center overflow-hidden rounded-lg border border-mist-800 bg-mist-900">
                {summary?.lastSync && (
                  <div
                    data-testid="last-sync-status"
                    title={`Fonte: ${summary.lastSync.source}\nAtualizado em: ${new Date(
                      summary.lastSync.timestamp,
                    ).toLocaleString('pt-BR')}`}
                    className="hidden sm:flex h-full items-center gap-2 border-r border-mist-800 px-3 text-xs text-stone-400"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    {(() => {
                      const count = extractTickerCount(summary.lastSync.source);
                      return count ? (
                        <span className="font-semibold text-stone-200 tabular-nums">
                          {count.toLocaleString('pt-BR')} ativos
                        </span>
                      ) : null;
                    })()}
                    <span className="text-stone-500">·</span>
                    <span className="tabular-nums">
                      atualizado {formatSyncAge(summary.lastSync.timestamp)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  data-testid="sync-b3-button"
                  className="flex h-full items-center gap-1.5 px-3 text-xs font-semibold text-stone-200 transition-colors hover:bg-mist-800 hover:text-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`}
                  />
                  {syncing ? 'Sincronizando...' : 'Sincronizar B3'}
                </button>
              </div>
            </div>
          </div>

          <nav
            aria-label="Opções de Ranking no Header"
            className="flex flex-wrap items-center gap-2 border-t border-mist-800/80 pt-2.5"
          >
            <span className="text-xs font-semibold text-stone-400 mr-1">
              Modo Inicial:
            </span>
            <Button
              type="button"
              size="sm"
              variant={activeHeaderPreset === 'todas' ? 'default' : 'outline'}
              data-testid="header-preset-all"
              onClick={() => handleHeaderPreset('todas')}
              className="h-8 rounded-lg"
            >
              Todas as Ações da Bolsa
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                activeHeaderPreset === 'maiores_receitas' ? 'default' : 'outline'
              }
              data-testid="header-preset-revenue"
              onClick={() => handleHeaderPreset('maiores_receitas')}
              className="h-8 rounded-lg"
            >
              Maiores Receitas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={
                activeHeaderPreset === 'maiores_valor_mercado'
                  ? 'default'
                  : 'outline'
              }
              data-testid="header-preset-marketcap"
              onClick={() => handleHeaderPreset('maiores_valor_mercado')}
              className="h-8 rounded-lg"
            >
              Maiores Valor de Mercado
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1520px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-mist-800 pb-2">
            <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-stone-400" />
              Resumo do Mercado B3
            </h2>
            <span className="text-xs text-stone-400">
              {total} empresas monitoradas
            </span>
          </div>

          <MarketSummaryCards
            summary={summary}
            selectedCategory={filters.thematicCategory}
            onSelectCategory={(cat) =>
              handleUpdateFilters({ thematicCategory: cat, page: 1 })
            }
            onSelectStock={handleSelectStock}
          />
        </div>

        <section
          aria-label="Filtro de Categorias da B3"
          className="rounded-xl border border-mist-800 bg-mist-900 p-4 shadow-sm"
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                Categorias da B3 (Multi-seleção)
              </span>
              {filters.sectors.length > 0 && (
                <Badge variant="default" className="text-[11px] font-semibold">
                  {filters.sectors.length} selecionada(s)
                </Badge>
              )}
            </div>
            {filters.sectors.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs rounded-lg"
                data-testid="clear-categories-btn"
                onClick={handleClearCategories}
              >
                Limpar Categorias
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" data-testid="category-chips-container">
            <button
              type="button"
              data-testid="category-chip-ALL"
              onClick={handleClearCategories}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.sectors.length === 0
                  ? 'border-mist-100 bg-mist-100 text-stone-950 font-bold'
                  : 'border-mist-800 bg-mist-950 text-stone-300 hover:bg-mist-800'
              }`}
            >
              Todas ({B3_STANDARD_CATEGORIES.length})
            </button>
            {B3_STANDARD_CATEGORIES.map((category) => {
              const isSelected = filters.sectors.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  data-testid={`category-chip-${category}`}
                  onClick={() => handleToggleCategory(category)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-mist-100 bg-mist-100 text-stone-950 font-bold'
                      : 'border-mist-800 bg-mist-950/80 text-stone-300 hover:bg-mist-800'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        {loadError && stocks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-amber-800/60 bg-amber-950/40 p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-amber-200">{loadError}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => loadData(filters)}
              className="border-amber-700 bg-amber-900/60 text-stone-100 hover:bg-amber-800 gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar Novamente
            </Button>
          </div>
        )}

        <div id="ranking-table-section">
          <StocksRankingTable
            items={stocks}
            total={total}
            page={filters.page}
            totalPages={totalPages}
            sectors={sectors}
            filters={filters}
            loading={loading}
            onUpdateFilters={handleUpdateFilters}
            onSelectStock={handleSelectStock}
          />
        </div>
      </main>

      <footer className="mt-16 border-t border-mist-800 bg-mist-900/80 py-8">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-4 px-4 sm:px-6 lg:px-8 text-xs text-stone-400">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-100">B-STOCKS TERMINAL</span>
              <span className="text-stone-600">•</span>
              <span>Análise Quantitativa B3</span>
            </div>
            <Link href="/" className="hover:text-stone-200 transition-colors">
              Voltar para a Landing Page Inicial &rarr;
            </Link>
          </div>
          <div className="border-t border-mist-800/80 pt-3 text-[11px] text-stone-500">
            Finalidade exclusivamente analítica e educacional. Não constitui recomendação de investimento.
          </div>
        </div>
      </footer>

      <StockDetailDialog
        stock={selectedStock}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
