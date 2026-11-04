'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CompanyLogo } from '@/components/company-logo';
import { fetchMarketOverview } from '@/lib/api';

export interface TickerStockItem {
  ticker: string;
  price: number;
  changePercent: number;
  logoUrl?: string;
}

type TickerStatus = 'loading' | 'ready' | 'unavailable';

// Keeps the scroll speed constant regardless of how many tickers the API returns.
const SECONDS_PER_ITEM = 4;

interface StockTickerCarouselProps {
  stocks?: TickerStockItem[];
}

export function StockTickerCarousel({ stocks }: StockTickerCarouselProps) {
  const [liveStocks, setLiveStocks] = useState<TickerStockItem[]>(
    stocks || [],
  );
  const [status, setStatus] = useState<TickerStatus>(
    stocks && stocks.length > 0 ? 'ready' : 'loading',
  );

  useEffect(() => {
    if (stocks && stocks.length > 0) {
      setLiveStocks(stocks);
      setStatus('ready');
      return;
    }

    let isMounted = true;
    fetchMarketOverview('1D')
      .then((res) => {
        if (!isMounted) {
          return;
        }
        if (!res.tickerTape || res.tickerTape.length === 0) {
          setStatus('unavailable');
          return;
        }
        const mapped: TickerStockItem[] = res.tickerTape.map((item) => ({
          ticker: item.ticker,
          price: item.price,
          changePercent: item.change24h || 0,
          logoUrl: item.logoUrl,
        }));
        setLiveStocks(mapped);
        setStatus('ready');
      })
      .catch(() => {
        if (isMounted) {
          setStatus('unavailable');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [stocks]);

  if (status !== 'ready' || liveStocks.length === 0) {
    return (
      <div
        data-testid="stock-ticker-carousel"
        data-status={status}
        className="relative w-full overflow-hidden border-y border-mist-800/80 bg-mist-950/90 py-3 backdrop-blur-md"
        aria-live="polite"
      >
        <p className="text-center text-xs font-semibold text-stone-400">
          {status === 'loading'
            ? 'Carregando cotações...'
            : 'Cotações indisponíveis no momento.'}
        </p>
      </div>
    );
  }

  const displayList = [...liveStocks, ...liveStocks];

  return (
    <div
      data-testid="stock-ticker-carousel"
      data-status={status}
      className="relative w-full overflow-hidden border-y border-mist-800/80 bg-mist-950/90 py-3 backdrop-blur-md"
      aria-label="Cotações das principais ações da B3"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-mist-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-mist-950 to-transparent" />

      <div
        className="animate-ticker flex items-center gap-4"
        style={{
          animationDuration: `${Math.max(30, liveStocks.length * SECONDS_PER_ITEM)}s`,
        }}
      >
        {displayList.map((item, index) => {
          const isPositive = item.changePercent >= 0;
          const formattedPrice = item.price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });
          const formattedChange = `${isPositive ? '+' : ''}${item.changePercent
            .toFixed(2)
            .replace('.', ',')}%`;

          return (
            <Link
              href={`/terminal?search=${encodeURIComponent(item.ticker)}`}
              key={`${item.ticker}-${index}`}
              data-testid="stock-ticker-item"
              className="group inline-flex items-center gap-2.5 rounded-lg border border-mist-800/80 bg-mist-900/75 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-stone-200 transition-all hover:border-mist-700 hover:bg-mist-900"
            >
              <CompanyLogo
                ticker={item.ticker}
                logoUrl={item.logoUrl}
                size="sm"
                className="h-5 w-5 rounded-md border-0 bg-transparent"
              />
              <span className="font-extrabold text-stone-100 group-hover:text-stone-200 transition-colors">
                {item.ticker}
              </span>
              <span className="tabular-nums text-stone-300">{formattedPrice}</span>
              <span
                className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 tabular-nums text-[11px] font-bold ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {formattedChange}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
