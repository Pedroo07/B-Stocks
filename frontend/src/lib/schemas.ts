import { z } from 'zod';

export const StockThesisSchema = z.object({
  id: z.string(),
  stockId: z.string(),
  strengths: z.string(),
  risks: z.string(),
  verdict: z.string(),
  businessCategory: z.string(),
  provider: z.string(),
  createdAt: z.string().optional(),
});

export type StockThesis = z.infer<typeof StockThesisSchema>;

export const B3_STANDARD_CATEGORIES = [
  'Água e Saneamento',
  'Bancos',
  'Bens Industriais',
  'Construção Civil',
  'Consumo Cíclico',
  'Consumo Não Cíclico',
  'Energia Elétrica',
  'Financeiro',
  'Materiais Básicos',
  'Mineração',
  'Petróleo, Gás e Biocombustíveis',
  'Previdência e Seguros',
  'Saúde',
  'Seguradoras',
  'Tecnologia',
  'Telecomunicações',
  'Utilidade Pública',
] as const;

export const RankingPresetEnum = z.enum([
  'valor_mercado',
  'dy',
  'graham',
  'margem_liquida',
  'buy_and_hold',
  'mais_queridas',
  'bazin',
  'maiores_receitas',
  'maiores_lucros',
  'maiores_altas',
  'maiores_baixas',
]);

export type RankingPreset = z.infer<typeof RankingPresetEnum>;

export const SortFieldEnum = z.enum([
  'scoreTotal',
  'bazinMargin',
  'bazinCeilingPrice',
  'grahamMargin',
  'grahamFairPrice',
  'dy',
  'dy5y',
  'roe',
  'pl',
  'pvp',
  'dailyLiquidity',
  'ticker',
  'price',
  'marketCap',
  'equity',
  'revenue',
  'netIncome',
  'netMargin',
  'grossDebtToEquity',
  'change24h',
  'change30d',
  'change12m',
  'change5y',
  'sector',
  'subsector',
  'segment',
]);

export type SortField = z.infer<typeof SortFieldEnum>;

export const StockItemSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  logoUrl: z.string().optional().default(''),
  sector: z.string(),
  subsector: z.string(),
  segment: z.string().optional().default('Novo Mercado'),
  price: z.number(),
  marketCap: z.number().optional().default(0),
  equity: z.number().optional().default(0),
  revenue: z.number().optional().default(0),
  netIncome: z.number().optional().default(0),
  pl: z.number(),
  pvp: z.number(),
  psr: z.number(),
  dy: z.number(),
  dy5y: z.number().optional().default(0),
  lpa: z.number(),
  vpa: z.number(),
  roe: z.number(),
  roic: z.number(),
  netMargin: z.number(),
  ebitMargin: z.number(),
  netDebtToEbitda: z.number(),
  grossDebtToEquity: z.number(),
  dailyLiquidity: z.number(),
  revenueGrowth5y: z.number(),
  avgDividends5y: z.number(),
  change24h: z.number().optional().default(0),
  change30d: z.number().optional().default(0),
  change12m: z.number().optional().default(0),
  change5y: z.number().optional().default(0),
  bazinCeilingPrice: z.number(),
  bazinMargin: z.number(),
  grahamFairPrice: z.number(),
  grahamMargin: z.number(),
  sma50: z.number(),
  sma200: z.number(),
  rsi14: z.number(),
  technicalTrend: z.string(),
  passesCutFilter: z.boolean(),
  cutFilterReason: z.string(),
  scoreTotal: z.number(),
  scoreValuation: z.number(),
  scoreDividends: z.number(),
  scoreProfitability: z.number(),
  scoreTechnical: z.number(),
  thematicCategory: z.string(),
  updatedAt: z.string().optional(),
  latestThesis: StockThesisSchema.nullable().optional(),
});

export type StockItem = z.infer<typeof StockItemSchema>;

export const PaginatedStocksResponseSchema = z.object({
  items: z.array(StockItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  sectors: z.array(z.string()),
});

export type PaginatedStocksResponse = z.infer<typeof PaginatedStocksResponseSchema>;

export const MarketSummarySchema = z.object({
  totalStocks: z.number(),
  passedCutCount: z.number(),
  bazinOpportunities: z.number(),
  grahamOpportunities: z.number(),
  avgScorePassed: z.number(),
  avgDyPassed: z.number(),
  avgRoePassed: z.number(),
  topRanking: z.array(StockItemSchema),
  categories: z.array(
    z.object({
      category: z.string(),
      count: z.number(),
    }),
  ),
  lastSync: z
    .object({
      source: z.string(),
      totalSynced: z.number(),
      timestamp: z.string(),
    })
    .nullable(),
});

export type MarketSummary = z.infer<typeof MarketSummarySchema>;

export const FilterParamsSchema = z.object({
  search: z.string().default(''),
  sector: z.string().default('ALL'),
  sectors: z.array(z.string()).default([]),
  thematicCategory: z.string().default('ALL'),
  rankingPreset: RankingPresetEnum.default('valor_mercado'),
  variationPeriod: z.enum(['24h', '30d', '12m']).default('24h'),
  onlyPassedCut: z.boolean().default(false),
  onlySmallCaps: z.boolean().default(false),
  oneStockPerCompany: z.boolean().default(false),
  onlyTop100Popular: z.boolean().default(false),
  minScore: z.number().min(0).max(100).default(0),
  sortBy: SortFieldEnum.default('marketCap'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(10).max(200).default(20),
});

export type FilterParams = z.infer<typeof FilterParamsSchema>;

export const BazinCustomSimSchema = z.object({
  targetYieldPercent: z.number().min(2).max(25),
});

export const IbovespaHistoryPointSchema = z.object({
  timestamp: z.number(),
  label: z.string(),
  fullDate: z.string(),
  close: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  volume: z.number(),
});

export type IbovespaHistoryPoint = z.infer<typeof IbovespaHistoryPointSchema>;

export const IbovespaOverviewSchema = z.object({
  symbol: z.string(),
  period: z.string(),
  currentPoints: z.number(),
  previousClose: z.number(),
  changePercent: z.number(),
  changePoints: z.number(),
  dayHigh: z.number(),
  dayLow: z.number(),
  volumeBrl: z.number(),
  updatedAt: z.string(),
  source: z.string(),
  points: z.array(IbovespaHistoryPointSchema),
});

export type IbovespaOverview = z.infer<typeof IbovespaOverviewSchema>;

export const MarketOverviewResponseSchema = z.object({
  ibovespa: IbovespaOverviewSchema,
  topGainers: z.array(StockItemSchema),
  topLosers: z.array(StockItemSchema),
  tickerTape: z.array(StockItemSchema),
});

export type MarketOverviewResponse = z.infer<
  typeof MarketOverviewResponseSchema
>;

export const MarketNewsArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  url: z.string(),
  imageUrl: z.string(),
  source: z.string(),
  publishedAt: z.string(),
});

export type MarketNewsArticle = z.infer<typeof MarketNewsArticleSchema>;

export const MarketNewsResponseSchema = z.object({
  items: z.array(MarketNewsArticleSchema),
  updatedAt: z.string(),
});

export type MarketNewsResponse = z.infer<typeof MarketNewsResponseSchema>;
