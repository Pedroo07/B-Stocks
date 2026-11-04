'use client';

import React, { useEffect, useState } from 'react';
import {
  FilterParams,
  RankingPreset,
  SortField,
  StockItem,
} from '@/lib/schemas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyLogo } from '@/components/company-logo';
import {
  formatCompactCurrency,
  formatCurrency,
  formatMultiple,
  formatPercent,
} from '@/lib/utils';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface StocksRankingTableProps {
  items: StockItem[];
  total: number;
  page: number;
  totalPages: number;
  sectors: string[];
  filters: FilterParams;
  loading: boolean;
  onUpdateFilters: (partial: Partial<FilterParams>) => void;
  onSelectStock: (stock: StockItem) => void;
}

export type ColumnKey =
  | 'marketCap'
  | 'pl'
  | 'pvp'
  | 'dy'
  | 'dy5y'
  | 'netMargin'
  | 'sector'
  | 'subsector'
  | 'segment'
  | 'price'
  | 'grahamFairPrice'
  | 'grahamMargin'
  | 'bazinCeilingPrice'
  | 'bazinMargin'
  | 'scoreTotal'
  | 'dailyLiquidity'
  | 'revenue'
  | 'netIncome'
  | 'equity'
  | 'grossDebtToEquity'
  | 'roe'
  | 'change24h'
  | 'change30d'
  | 'change12m'
  | 'change5y';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortField: SortField;
  isPro?: boolean;
}

const ALL_COLUMNS_MAP: Record<ColumnKey, ColumnDef> = {
  marketCap: {
    key: 'marketCap',
    label: 'Valor de Mercado',
    sortField: 'marketCap',
  },
  pl: { key: 'pl', label: 'P/L', sortField: 'pl' },
  pvp: { key: 'pvp', label: 'P/VP', sortField: 'pvp' },
  dy: { key: 'dy', label: 'Dividend Yield', sortField: 'dy' },
  dy5y: { key: 'dy5y', label: 'DY Médio 5 anos', sortField: 'dy5y' },
  netMargin: {
    key: 'netMargin',
    label: 'Margem Líquida',
    sortField: 'netMargin',
  },
  sector: { key: 'sector', label: 'Setor', sortField: 'sector' },
  subsector: { key: 'subsector', label: 'Subsetor', sortField: 'subsector' },
  segment: { key: 'segment', label: 'Segmento', sortField: 'segment' },
  price: { key: 'price', label: 'Preço Atual', sortField: 'price' },
  grahamFairPrice: {
    key: 'grahamFairPrice',
    label: 'Preço Justo de Graham',
    sortField: 'grahamFairPrice',
    isPro: true,
  },
  grahamMargin: {
    key: 'grahamMargin',
    label: 'Upside de Graham',
    sortField: 'grahamMargin',
  },
  bazinCeilingPrice: {
    key: 'bazinCeilingPrice',
    label: 'Preço-teto de Bazin',
    sortField: 'bazinCeilingPrice',
    isPro: true,
  },
  bazinMargin: {
    key: 'bazinMargin',
    label: 'Upside de Bazin',
    sortField: 'bazinMargin',
  },
  scoreTotal: {
    key: 'scoreTotal',
    label: 'Pontuação Buy And Hold',
    sortField: 'scoreTotal',
    isPro: true,
  },
  dailyLiquidity: {
    key: 'dailyLiquidity',
    label: 'Liquidez Diária',
    sortField: 'dailyLiquidity',
  },
  revenue: { key: 'revenue', label: 'Maiores Receitas', sortField: 'revenue' },
  netIncome: {
    key: 'netIncome',
    label: 'Maiores Lucros',
    sortField: 'netIncome',
  },
  equity: {
    key: 'equity',
    label: 'Patrimônio Líquido',
    sortField: 'equity',
  },
  grossDebtToEquity: {
    key: 'grossDebtToEquity',
    label: 'Dívida Bruta / Patrimônio',
    sortField: 'grossDebtToEquity',
  },
  roe: { key: 'roe', label: 'ROE', sortField: 'roe' },
  change24h: {
    key: 'change24h',
    label: 'Variação 24h',
    sortField: 'change24h',
  },
  change30d: {
    key: 'change30d',
    label: 'Variação 30d',
    sortField: 'change30d',
  },
  change12m: {
    key: 'change12m',
    label: 'Variação 12m',
    sortField: 'change12m',
  },
  change5y: {
    key: 'change5y',
    label: 'Variação 5 Anos',
    sortField: 'change5y',
  },
};

const INDICATOR_TOOLTIPS: Partial<Record<ColumnKey, { title: string; desc: string }>> = {
  grahamFairPrice: {
    title: 'Preço Justo de Graham',
    desc: 'Indica até quanto vale pagar pela ação, de acordo com a fórmula de Benjamin Graham: √(22,5 × LPA × VPA).',
  },
  grahamMargin: {
    title: 'Upside de Graham',
    desc: 'Potencial de valorização e margem de segurança entre o preço atual da ação e o valor justo de Graham.',
  },
  pl: {
    title: 'P/L (Preço sobre Lucro)',
    desc: 'Mostra quantos anos de lucro a empresa precisaria gerar para "pagar" o valor atual da ação.',
  },
  pvp: {
    title: 'P/VP (Preço sobre Valor Patrimonial)',
    desc: 'Indica se a ação é negociada com ágio ou desconto em relação ao patrimônio líquido contábil por ação.',
  },
  bazinCeilingPrice: {
    title: 'Preço-teto de Bazin',
    desc: 'Preço máximo a pagar para garantir um Dividend Yield mínimo desejado de 6% ao ano, segundo Décio Bazin.',
  },
  bazinMargin: {
    title: 'Upside de Bazin',
    desc: 'Margem percentual de desconto ou prêmio da cotação atual em relação ao Preço-teto de Bazin.',
  },
  dy: {
    title: 'Dividend Yield (DY)',
    desc: 'Rendimento gerado em proventos e dividendos pagos aos acionistas em relação à cotação atual nos últimos 12 meses.',
  },
  dy5y: {
    title: 'DY Médio 5 anos',
    desc: 'Média histórica anual do Dividend Yield distribuído pela companhia nos últimos 5 anos.',
  },
  netMargin: {
    title: 'Margem Líquida',
    desc: 'Percentual de cada R$ 1 de faturamento líquido que se converte em lucro líquido para a empresa.',
  },
  scoreTotal: {
    title: 'Pontuação Buy And Hold',
    desc: 'Score quantitativo ponderado de 0 a 100 avaliando valuation, dividendos, rentabilidade e momento estrutural.',
  },
  roe: {
    title: 'ROE (Retorno sobre Patrimônio)',
    desc: 'Mede a eficiência da empresa em gerar lucros com seus próprios recursos patrimoniais.',
  },
  marketCap: {
    title: 'Valor de Mercado',
    desc: 'Valor total da companhia calculado multiplicando o total de ações emitidas pelo preço atual de mercado.',
  },
  dailyLiquidity: {
    title: 'Liquidez Diária',
    desc: 'Volume financeiro médio diário negociado no mercado. Acima de R$ 1 milhão garante facilidade de compra e venda.',
  },
  revenue: {
    title: 'Receita Líquida',
    desc: 'Receita operacional líquida acumulada nos últimos 12 meses reportados pela companhia.',
  },
  netIncome: {
    title: 'Lucro Líquido',
    desc: 'Resultado líquido final acumulado nos últimos 12 meses após impostos e despesas financeiras.',
  },
  equity: {
    title: 'Patrimônio Líquido',
    desc: 'Valor contábil total pertencente aos acionistas (ativos totais menos passivos exigíveis).',
  },
  grossDebtToEquity: {
    title: 'Dívida Bruta / Patrimônio',
    desc: 'Nível de endividamento da companhia frente ao patrimônio líquido. Quanto menor, mais segura a estrutura de capital.',
  },
  change24h: {
    title: 'Variação 24h',
    desc: 'Oscilação percentual do preço da ação nas últimas 24 horas de negociação na B3.',
  },
  change30d: {
    title: 'Variação 30d',
    desc: 'Oscilação percentual acumulada do preço da ação no período dos últimos 30 dias.',
  },
  change12m: {
    title: 'Variação 12m',
    desc: 'Oscilação percentual acumulada do preço da ação no período dos últimos 12 meses.',
  },
  change5y: {
    title: 'Variação 5 Anos',
    desc: 'Oscilação percentual acumulada do preço da ação nos últimos 5 anos.',
  },
};

const ADVANCED_PRO_COLUMNS: ColumnKey[] = [
  'scoreTotal',
  'bazinCeilingPrice',
  'grahamFairPrice',
];

const GENERAL_DATA_COLUMNS: ColumnKey[] = [
  'pl',
  'pvp',
  'dy',
  'dy5y',
  'change5y',
  'change12m',
  'price',
  'roe',
  'netMargin',
  'marketCap',
  'equity',
  'grossDebtToEquity',
  'sector',
  'subsector',
  'segment',
];

function ThemedCheckbox({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <span className="relative inline-flex h-4 w-4 shrink-0">
      <input
        type="checkbox"
        className={`peer h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-mist-700 bg-mist-950 transition-colors group-hover/check:border-mist-500 checked:border-emerald-500 checked:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:cursor-not-allowed disabled:border-mist-700 disabled:bg-mist-800 ${className ?? ''}`}
        {...props}
      />
      <Check
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-mist-950 opacity-0 transition-opacity peer-checked:opacity-100 peer-disabled:text-stone-500"
      />
    </span>
  );
}

const PRESET_CONFIG: Record<
  RankingPreset,
  {
    label: string;
    primaryColumn: ColumnKey;
    defaultSortBy: SortField;
    defaultSortOrder: 'asc' | 'desc';
    columns: ColumnKey[];
  }
> = {
  valor_mercado: {
    label: '1. Valor de Mercado',
    primaryColumn: 'marketCap',
    defaultSortBy: 'marketCap',
    defaultSortOrder: 'desc',
    columns: ['marketCap', 'pl', 'pvp', 'dy', 'netMargin', 'sector'],
  },
  dy: {
    label: '2. DY (Dividend Yield + DY Médio 5 Anos)',
    primaryColumn: 'dy',
    defaultSortBy: 'dy',
    defaultSortOrder: 'desc',
    columns: ['dy', 'dy5y', 'pl', 'pvp', 'netMargin', 'sector'],
  },
  graham: {
    label: '3. Mais Baratas Graham',
    primaryColumn: 'grahamMargin',
    defaultSortBy: 'grahamMargin',
    defaultSortOrder: 'desc',
    columns: [
      'grahamMargin',
      'price',
      'grahamFairPrice',
      'pl',
      'pvp',
      'change5y',
      'sector',
    ],
  },
  margem_liquida: {
    label: '4. Margem Líquida',
    primaryColumn: 'netMargin',
    defaultSortBy: 'netMargin',
    defaultSortOrder: 'desc',
    columns: ['netMargin', 'marketCap', 'pl', 'pvp', 'dy', 'sector'],
  },
  buy_and_hold: {
    label: '5. Buy and Hold',
    primaryColumn: 'scoreTotal',
    defaultSortBy: 'scoreTotal',
    defaultSortOrder: 'desc',
    columns: [
      'scoreTotal',
      'pl',
      'pvp',
      'dy',
      'grahamFairPrice',
      'grahamMargin',
      'marketCap',
      'sector',
    ],
  },
  mais_queridas: {
    label: '6. Mais Queridas (Top 100 Mais Compradas)',
    primaryColumn: 'dailyLiquidity',
    defaultSortBy: 'dailyLiquidity',
    defaultSortOrder: 'desc',
    columns: [
      'dailyLiquidity',
      'marketCap',
      'pl',
      'pvp',
      'dy',
      'netMargin',
      'sector',
    ],
  },
  bazin: {
    label: '7. Mais Baratas Bazin',
    primaryColumn: 'bazinMargin',
    defaultSortBy: 'bazinMargin',
    defaultSortOrder: 'desc',
    columns: [
      'bazinMargin',
      'price',
      'bazinCeilingPrice',
      'pl',
      'pvp',
      'change5y',
      'sector',
    ],
  },
  maiores_receitas: {
    label: '8. Maiores Receitas',
    primaryColumn: 'revenue',
    defaultSortBy: 'revenue',
    defaultSortOrder: 'desc',
    columns: ['revenue', 'marketCap', 'pl', 'pvp', 'netMargin', 'sector'],
  },
  maiores_lucros: {
    label: '9. Maiores Lucros',
    primaryColumn: 'netIncome',
    defaultSortBy: 'netIncome',
    defaultSortOrder: 'desc',
    columns: ['netIncome', 'marketCap', 'pl', 'pvp', 'netMargin', 'sector'],
  },
  maiores_altas: {
    label: '10. Maiores Altas (24hrs, 30 dias e 12 meses)',
    primaryColumn: 'change24h',
    defaultSortBy: 'change24h',
    defaultSortOrder: 'desc',
    columns: [
      'change24h',
      'change30d',
      'change12m',
      'price',
      'pl',
      'pvp',
      'sector',
    ],
  },
  maiores_baixas: {
    label: '11. Maiores Baixas (24hrs, 30 dias e 12 meses)',
    primaryColumn: 'change24h',
    defaultSortBy: 'change24h',
    defaultSortOrder: 'asc',
    columns: [
      'change24h',
      'change30d',
      'change12m',
      'price',
      'pl',
      'pvp',
      'sector',
    ],
  },
};

export function StocksRankingTable({
  items,
  total,
  page,
  totalPages,
  filters,
  loading,
  onUpdateFilters,
  onSelectStock,
}: StocksRankingTableProps) {
  const [customizeOpen, setCustomizeOpen] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<ColumnKey | null>(null);
  const [customColumns, setCustomColumns] = useState<ColumnKey[]>(
    PRESET_CONFIG[filters.rankingPreset].columns,
  );

  useEffect(() => {
    const presetCols = PRESET_CONFIG[filters.rankingPreset]?.columns || [
      'marketCap',
      'pl',
      'pvp',
      'dy',
      'netMargin',
      'sector',
    ];
    setCustomColumns(presetCols);
  }, [filters.rankingPreset]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveTooltip(null);
    };
    if (activeTooltip) {
      window.addEventListener('click', handleGlobalClick);
      return () => {
        window.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [activeTooltip]);

  const handleRankingPresetChange = (preset: RankingPreset) => {
    const cfg = PRESET_CONFIG[preset];
    let nextSortBy = cfg.defaultSortBy;
    if (preset === 'maiores_altas' || preset === 'maiores_baixas') {
      nextSortBy =
        filters.variationPeriod === '30d'
          ? 'change30d'
          : filters.variationPeriod === '12m'
            ? 'change12m'
            : 'change24h';
    }
    onUpdateFilters({
      rankingPreset: preset,
      onlyTop100Popular: preset === 'mais_queridas',
      sortBy: nextSortBy,
      sortOrder: cfg.defaultSortOrder,
      page: 1,
    });
  };

  const handleVariationPeriodChange = (period: '24h' | '30d' | '12m') => {
    const sortByField: SortField =
      period === '30d'
        ? 'change30d'
        : period === '12m'
          ? 'change12m'
          : 'change24h';
    onUpdateFilters({
      variationPeriod: period,
      sortBy: sortByField,
      sortOrder: filters.rankingPreset === 'maiores_baixas' ? 'asc' : 'desc',
      page: 1,
    });
  };

  const handleColumnSort = (field: SortField) => {
    if (filters.sortBy === field) {
      onUpdateFilters({
        sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc',
        page: 1,
      });
    } else {
      onUpdateFilters({
        sortBy: field,
        sortOrder: field === 'ticker' || field === 'sector' ? 'asc' : 'desc',
        page: 1,
      });
    }
  };

  const handleToggleCustomColumn = (colKey: ColumnKey) => {
    if (colKey === 'pl' || colKey === 'pvp') {
      return;
    }
    setCustomColumns((prev) => {
      if (prev.includes(colKey)) {
        return prev.filter((k) => k !== colKey);
      }
      return [...prev, colKey];
    });
  };

  const activeColumns: ColumnDef[] = (() => {
    const ensured = new Set<ColumnKey>(customColumns);
    ensured.add('pl');
    ensured.add('pvp');
    return Array.from(ensured).map((key) => ALL_COLUMNS_MAP[key]);
  })();

  const primaryColKey =
    PRESET_CONFIG[filters.rankingPreset]?.primaryColumn || 'marketCap';

  const getScoreBadgeVariant = (score: number, passes: boolean) => {
    if (!passes) return 'secondary';
    if (score >= 70) return 'positive';
    if (score >= 50) return 'warning';
    return 'negative';
  };

  const getMarginBadgeVariant = (margin: number) => {
    if (margin >= 10) return 'positive';
    if (margin >= 0) return 'warning';
    return 'negative';
  };

  const renderSortIcon = (field: SortField) => {
    if (filters.sortBy !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-stone-500" />;
    }
    return filters.sortOrder === 'desc' ? (
      <ArrowDown className="ml-1 h-3 w-3 text-stone-200" />
    ) : (
      <ArrowUp className="ml-1 h-3 w-3 text-stone-200" />
    );
  };

  const renderCellValue = (stock: StockItem, colKey: ColumnKey) => {
    switch (colKey) {
      case 'marketCap':
        return (
          <span className="font-semibold text-stone-200 tabular-nums">
            {stock.marketCap > 0 ? formatCompactCurrency(stock.marketCap) : '-'}
          </span>
        );
      case 'pl':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {formatMultiple(stock.pl)}
          </span>
        );
      case 'pvp':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {formatMultiple(stock.pvp)}
          </span>
        );
      case 'dy':
        return (
          <span className="font-semibold text-stone-200 tabular-nums">
            {stock.dy > 0 ? formatPercent(stock.dy) : '-'}
          </span>
        );
      case 'dy5y':
        return (
          <span className="font-medium text-stone-300 tabular-nums">
            {stock.dy5y > 0 ? formatPercent(stock.dy5y) : '-'}
          </span>
        );
      case 'netMargin':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {stock.netMargin !== 0 ? formatPercent(stock.netMargin) : '-'}
          </span>
        );
      case 'sector':
        return (
          <Badge variant="secondary" className="text-[11px] font-medium">
            {stock.sector || '-'}
          </Badge>
        );
      case 'subsector':
        return (
          <span className="text-xs text-stone-400">{stock.subsector || '-'}</span>
        );
      case 'segment':
        return (
          <Badge
            variant="outline"
            className="text-[11px] text-stone-300 border-mist-700"
          >
            {stock.segment || '-'}
          </Badge>
        );
      case 'price':
        return (
          <span className="font-semibold text-stone-200 tabular-nums">
            {stock.price > 0 ? formatCurrency(stock.price) : '-'}
          </span>
        );
      case 'grahamFairPrice':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {stock.grahamFairPrice > 0
              ? formatCurrency(stock.grahamFairPrice)
              : '-'}
          </span>
        );
      case 'grahamMargin':
        return stock.grahamFairPrice > 0 ? (
          <Badge
            variant={getMarginBadgeVariant(stock.grahamMargin)}
            className="px-1.5 py-0.5 text-xs tabular-nums"
          >
            {formatPercent(stock.grahamMargin, true)}
          </Badge>
        ) : (
          <span className="text-xs text-stone-500">-</span>
        );
      case 'bazinCeilingPrice':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {stock.bazinCeilingPrice > 0
              ? formatCurrency(stock.bazinCeilingPrice)
              : '-'}
          </span>
        );
      case 'bazinMargin':
        return stock.bazinCeilingPrice > 0 ? (
          <Badge
            variant={getMarginBadgeVariant(stock.bazinMargin)}
            className="px-1.5 py-0.5 text-xs tabular-nums"
          >
            {formatPercent(stock.bazinMargin, true)}
          </Badge>
        ) : (
          <span className="text-xs text-stone-500">-</span>
        );
      case 'scoreTotal':
        return (
          <Badge
            variant={getScoreBadgeVariant(
              stock.scoreTotal,
              stock.passesCutFilter,
            )}
            className="text-xs font-bold tabular-nums"
          >
            {stock.scoreTotal.toFixed(1).replace('.', ',')} / 100
          </Badge>
        );
      case 'dailyLiquidity':
        return (
          <span className="font-semibold text-stone-200 tabular-nums">
            {stock.dailyLiquidity > 0
              ? formatCompactCurrency(stock.dailyLiquidity)
              : '-'}
          </span>
        );
      case 'revenue':
        return (
          <span className="font-semibold text-stone-200 tabular-nums">
            {stock.revenue > 0 ? formatCompactCurrency(stock.revenue) : '-'}
          </span>
        );
      case 'netIncome':
        return stock.netIncome !== 0 ? (
          <span
            className={`font-semibold tabular-nums ${
              stock.netIncome >= 0 ? 'text-stone-200' : 'text-red-400'
            }`}
          >
            {formatCompactCurrency(stock.netIncome)}
          </span>
        ) : (
          <span className="text-stone-500">-</span>
        );
      case 'equity':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {stock.equity > 0 ? formatCompactCurrency(stock.equity) : '-'}
          </span>
        );
      case 'grossDebtToEquity':
        return (
          <span className="font-medium text-stone-300 tabular-nums">
            {stock.grossDebtToEquity > 0
              ? formatMultiple(stock.grossDebtToEquity)
              : '-'}
          </span>
        );
      case 'roe':
        return (
          <span className="font-medium text-stone-200 tabular-nums">
            {stock.roe !== 0 ? formatPercent(stock.roe) : '-'}
          </span>
        );
      case 'change24h':
        return stock.change24h !== 0 ? (
          <Badge
            variant={getMarginBadgeVariant(stock.change24h)}
            className="px-1.5 py-0.5 text-xs tabular-nums"
          >
            {formatPercent(stock.change24h, true)}
          </Badge>
        ) : (
          <span className="text-xs text-stone-500">-</span>
        );
      case 'change30d':
        return stock.change30d !== 0 ? (
          <Badge
            variant={getMarginBadgeVariant(stock.change30d)}
            className="px-1.5 py-0.5 text-xs tabular-nums"
          >
            {formatPercent(stock.change30d, true)}
          </Badge>
        ) : (
          <span className="text-xs text-stone-500">-</span>
        );
      case 'change12m':
        return stock.change12m !== 0 ? (
          <Badge
            variant={getMarginBadgeVariant(stock.change12m)}
            className="px-1.5 py-0.5 text-xs tabular-nums"
          >
            {formatPercent(stock.change12m, true)}
          </Badge>
        ) : (
          <span className="text-xs text-stone-500">-</span>
        );
      case 'change5y':
        return stock.change5y !== 0 ? (
          <Badge
            variant={getMarginBadgeVariant(stock.change5y)}
            className="px-1.5 py-0.5 text-xs tabular-nums"
          >
            {formatPercent(stock.change5y, true)}
          </Badge>
        ) : (
          <span className="text-xs text-stone-500">-</span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="border-mist-800 bg-mist-900 rounded-xl shadow-sm">
      <CardHeader className="border-b border-mist-800 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-stone-100">
              Ranking de Ações da B3
            </CardTitle>
            <p className="mt-1 text-xs text-stone-400">
              Exibindo {items.length} de {total} empresas listadas na B3
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-mist-800 bg-mist-950 px-3 py-1.5">
              <Switch
                data-testid="cut-filter-switch"
                checked={filters.onlyPassedCut}
                onCheckedChange={(checked) =>
                  onUpdateFilters({ onlyPassedCut: checked, page: 1 })
                }
              />
              <span className="text-xs font-medium text-stone-300">
                Filtro de Corte (Liq &gt; R$ 1M e Dív/EBITDA &lt; 3,0)
              </span>
            </div>

            <Button
              type="button"
              variant={customizeOpen ? 'default' : 'outline'}
              size="sm"
              data-testid="customize-button"
              onClick={() => setCustomizeOpen((prev) => !prev)}
              className="rounded-lg"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              Customizar
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-500" />
            <Input
              data-testid="search-input"
              placeholder="Buscar por ticker (ex: PETR4, BBAS3, TAEE11) ou empresa..."
              value={filters.search}
              onChange={(e) =>
                onUpdateFilters({ search: e.target.value, page: 1 })
              }
              className="pl-9 bg-mist-950 border-mist-800 text-stone-100 placeholder:text-stone-500 rounded-lg"
            />
          </div>

          <div>
            <Select
              value={filters.rankingPreset}
              onValueChange={(value) =>
                handleRankingPresetChange(value as RankingPreset)
              }
            >
              <SelectTrigger data-testid="sort-select" aria-label="Ranking por">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="shrink-0 text-stone-500">Ranking por</span>
                  <span className="truncate font-semibold text-stone-100">
                    <SelectValue />
                  </span>
                </span>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRESET_CONFIG) as RankingPreset[]).map((key) => {
                  const match = PRESET_CONFIG[key].label.match(/^(\d+)\.\s*(.*)$/);
                  const number = match?.[1];
                  const text = match?.[2] ?? PRESET_CONFIG[key].label;
                  return (
                    <SelectItem
                      key={key}
                      value={key}
                      data-testid={`sort-option-${key}`}
                      leading={
                        number ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-mist-700 bg-mist-950 text-[10px] font-bold tabular-nums text-stone-400">
                            {number}
                          </span>
                        ) : null
                      }
                    >
                      {text}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 flex-1 rounded-lg border-mist-800 bg-mist-950 text-stone-300 hover:bg-mist-800 hover:text-stone-100"
              onClick={() =>
                onUpdateFilters({
                  sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc',
                  page: 1,
                })
              }
            >
              {filters.sortOrder === 'desc' ? (
                <>
                  <ArrowDown className="mr-1.5 h-3.5 w-3.5" /> Maior p/ Menor
                </>
              ) : (
                <>
                  <ArrowUp className="mr-1.5 h-3.5 w-3.5" /> Menor p/ Maior
                </>
              )}
            </Button>
            <Select
              value={String(filters.limit)}
              onValueChange={(value) =>
                onUpdateFilters({ limit: Number(value), page: 1 })
              }
            >
              <SelectTrigger
                data-testid="limit-select"
                aria-label="Itens por página"
                className="w-[104px] shrink-0"
              >
                <span className="font-semibold text-stone-100">
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent align="end">
                {[20, 50, 100, 200].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / pág
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(filters.rankingPreset === 'maiores_altas' ||
          filters.rankingPreset === 'maiores_baixas') && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-mist-800 bg-mist-950 px-3 py-2">
            <span className="text-xs font-semibold text-stone-300">
              Período da Variação:
            </span>
            {(['24h', '30d', '12m'] as const).map((period) => (
              <Button
                key={period}
                type="button"
                size="sm"
                variant={
                  filters.variationPeriod === period ? 'default' : 'outline'
                }
                className="h-7 px-2.5 text-xs rounded-lg"
                data-testid={`variation-period-${period}`}
                onClick={() => handleVariationPeriodChange(period)}
              >
                {period === '24h'
                  ? '24 Horas'
                  : period === '30d'
                    ? '30 Dias'
                    : '12 Meses'}
              </Button>
            ))}
          </div>
        )}

        {customizeOpen && (
          <div
            data-testid="customize-panel"
            className="mt-3 rounded-xl border border-mist-800 bg-mist-950 p-4"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-stone-200">
                  Configurações
                </h4>
                <div className="space-y-0.5">
                  <label className="group/check -mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:bg-mist-900 hover:text-stone-100 has-[:disabled]:cursor-default has-[:disabled]:hover:bg-transparent">
                    <ThemedCheckbox
                      data-testid="config-small-caps"
                      checked={filters.onlySmallCaps}
                      onChange={(e) =>
                        onUpdateFilters({
                          onlySmallCaps: e.target.checked,
                          page: 1,
                        })
                      }
                    />
                    Apenas Small Caps
                  </label>
                  <label className="group/check -mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:bg-mist-900 hover:text-stone-100 has-[:disabled]:cursor-default has-[:disabled]:hover:bg-transparent">
                    <ThemedCheckbox
                      data-testid="config-one-per-company"
                      checked={filters.oneStockPerCompany}
                      onChange={(e) =>
                        onUpdateFilters({
                          oneStockPerCompany: e.target.checked,
                          page: 1,
                        })
                      }
                    />
                    Uma Ação por empresa
                  </label>
                </div>
              </div>

              <div>
                <div className="mb-2.5 flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                    Dados Avançados — Coluna PRO
                  </h4>
                  <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                    PRO
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  {ADVANCED_PRO_COLUMNS.map((colKey) => {
                    const col = ALL_COLUMNS_MAP[colKey];
                    const checked = customColumns.includes(colKey);
                    return (
                      <label
                        key={colKey}
                        className="group/check -mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:bg-mist-900 hover:text-stone-100 has-[:disabled]:cursor-default has-[:disabled]:hover:bg-transparent"
                      >
                        <ThemedCheckbox
                          data-testid={`custom-col-${colKey}`}
                          checked={checked}
                          onChange={() => handleToggleCustomColumn(colKey)}
                        />
                        <span>{col.label}</span>
                        <Badge
                          variant="secondary"
                          className="px-1 py-0 text-[9px]"
                        >
                          PRO
                        </Badge>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-stone-200">
                  Dados Gerais
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {GENERAL_DATA_COLUMNS.map((colKey) => {
                    const col = ALL_COLUMNS_MAP[colKey];
                    const isLocked = colKey === 'pl' || colKey === 'pvp';
                    const checked = isLocked || customColumns.includes(colKey);
                    return (
                      <label
                        key={colKey}
                        className="group/check -mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:bg-mist-900 hover:text-stone-100 has-[:disabled]:cursor-default has-[:disabled]:hover:bg-transparent"
                      >
                        <ThemedCheckbox
                          data-testid={`custom-col-${colKey}`}
                          checked={checked}
                          disabled={isLocked}
                          onChange={() => handleToggleCustomColumn(colKey)}
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-mist-800 hover:bg-mist-900 bg-mist-950/60">
              <TableHead className="w-12 text-stone-400">#</TableHead>
              <TableHead>
                <button
                  type="button"
                  data-testid="header-sort-btn-ticker"
                  onClick={() => handleColumnSort('ticker')}
                  className="inline-flex items-center font-bold text-stone-200 hover:text-stone-100"
                >
                  Ativos
                  {renderSortIcon('ticker')}
                </button>
              </TableHead>
              {activeColumns.map((col) => {
                const isPrimary = col.key === primaryColKey;
                const info = INDICATOR_TOOLTIPS[col.key];
                return (
                  <TableHead key={col.key} className="text-stone-300">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        data-testid={`header-sort-btn-${col.key}`}
                        onClick={() => handleColumnSort(col.sortField)}
                        className="inline-flex items-center text-left font-bold text-stone-200 hover:text-stone-100"
                      >
                        {isPrimary ? `(${col.label})` : col.label}
                        {renderSortIcon(col.sortField)}
                      </button>
                      {info && (
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            data-testid={`info-btn-${col.key}`}
                            title={`${info.title}: ${info.desc}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTooltip((prev) =>
                                prev === col.key ? null : col.key,
                              );
                            }}
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-mist-700 bg-mist-800 text-[10px] font-bold text-stone-400 hover:border-mist-500 hover:text-stone-100 focus:outline-none"
                            aria-label={`Informações sobre ${info.title}`}
                          >
                            ?
                          </button>
                          {activeTooltip === col.key && (
                            <div
                              data-testid={`tooltip-content-${col.key}`}
                              className="absolute left-1/2 top-full z-50 mt-1.5 w-64 -translate-x-1/2 rounded-lg border border-mist-700 bg-mist-900 p-2.5 text-xs text-stone-200 shadow-xl"
                            >
                              <div className="flex items-center justify-between border-b border-mist-800 pb-1">
                                <span className="font-bold text-stone-100">
                                  {info.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTooltip(null);
                                  }}
                                  className="text-[10px] text-stone-400 hover:text-stone-200"
                                >
                                  ✕
                                </button>
                              </div>
                              <p className="mt-1.5 leading-relaxed text-stone-300">
                                {info.desc}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="text-right text-stone-300">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <TableRow key={idx} className="border-mist-800">
                  <TableCell
                    colSpan={activeColumns.length + 3}
                    className="h-12 text-center text-xs text-stone-500"
                  >
                    Carregando dados quantitativos da B3...
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow className="border-mist-800">
                <TableCell
                  colSpan={activeColumns.length + 3}
                  className="h-24 text-center text-sm text-stone-400"
                >
                  Nenhuma ação encontrada para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              items.map((stock, index) => {
                const rankNumber = (page - 1) * filters.limit + index + 1;
                return (
                  <TableRow
                    key={stock.ticker}
                    data-testid={`stock-row-${stock.ticker}`}
                    className="h-16 cursor-pointer border-mist-800/80 hover:bg-mist-850"
                    onClick={() => onSelectStock(stock)}
                  >
                    <TableCell className="py-4 text-xs font-medium text-stone-500">
                      {rankNumber}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3.5">
                        <CompanyLogo
                          ticker={stock.ticker}
                          logoUrl={stock.logoUrl}
                          companyName={stock.companyName}
                          size="md"
                        />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-stone-100">
                              {stock.ticker}
                            </span>
                            {!stock.passesCutFilter && (
                              <Badge
                                variant="outline"
                                className="px-1 py-0 text-[10px] text-stone-400 border-mist-700"
                              >
                                Alerta Corte
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 truncate max-w-[180px]">
                            {stock.companyName}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    {activeColumns.map((col) => (
                      <TableCell key={col.key} className="py-4">
                        {renderCellValue(stock, col.key)}
                      </TableCell>
                    ))}
                    <TableCell className="py-4 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`analyze-btn-${stock.ticker}`}
                        className="rounded-lg border-mist-800 bg-mist-950 text-stone-300 hover:bg-mist-800 hover:text-stone-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(stock);
                        }}
                      >
                        Analisar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-mist-800 px-4 py-3 sm:flex-row">
          <div className="text-xs text-stone-400">
            Página <span className="font-bold text-stone-100">{page}</span> de{' '}
            <span className="font-bold text-stone-100">{totalPages}</span> ({total}{' '}
            ações encontradas)
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              className="rounded-lg border-mist-800 bg-mist-950 text-stone-300 hover:bg-mist-800 hover:text-stone-100 disabled:opacity-40"
              onClick={() => onUpdateFilters({ page: Math.max(1, page - 1) })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              className="rounded-lg border-mist-800 bg-mist-950 text-stone-300 hover:bg-mist-800 hover:text-stone-100 disabled:opacity-40"
              onClick={() =>
                onUpdateFilters({ page: Math.min(totalPages, page + 1) })
              }
            >
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
