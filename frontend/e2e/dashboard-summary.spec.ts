import { test, expect } from '@playwright/test';

test.describe('Landing Page and Terminal Market Summary UI', () => {
  test('renders standalone landing page with ticker carousel, real recharts ibov chart, top 5 rankings preview and b3 news', async ({
    page,
  }) => {
    await page.goto('/');

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    const tickerEl = page.getByTestId('stock-ticker-carousel');
    await expect(tickerEl).toBeVisible();
    await expect(tickerEl).toHaveAttribute('data-status', 'ready', {
      timeout: 15000,
    });
    await expect(
      tickerEl.getByTestId('stock-ticker-item').first(),
    ).toContainText(/R\$\s?\d/);

    const ibovOverview = page.getByTestId('ibov-market-overview');
    await expect(ibovOverview).toBeVisible();
    await expect(ibovOverview).toContainText('IBOVESPA');
    await expect(page.getByTestId('ibov-current-points')).toHaveText(
      /\d{2,3}\.\d{3},\d{2}/,
      { timeout: 15000 },
    );
    await expect(page.getByTestId('ibov-recharts-container')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('ibov-top-gainers-card')).toContainText(
      'Maiores Altas do Pregão',
    );
    await expect(page.getByTestId('ibov-top-losers-card')).toContainText(
      'Maiores Baixas do Pregão',
    );

    const anyLogo = ibovOverview.locator('[data-testid^="company-logo-"]');
    await expect(anyLogo.first()).toBeVisible({ timeout: 15000 });

    const rankingsSection = page.getByTestId('landing-rankings-section');
    await expect(rankingsSection).toBeVisible();
    await expect(page.getByTestId('landing-ranking-card-todas')).toBeVisible();
    await expect(
      page.getByTestId('landing-ranking-card-receitas'),
    ).toBeVisible();
    await expect(
      page.getByTestId('landing-ranking-card-valor-mercado'),
    ).toBeVisible();

    const verRankingTodas = page.getByTestId('ver-ranking-btn-todas');
    await expect(verRankingTodas).toContainText('Ver Ranking');
    await expect(verRankingTodas.locator('xpath=..')).toHaveAttribute(
      'href',
      '/terminal?headerPreset=todas',
    );
    await expect(
      page.getByTestId('ver-ranking-btn-maiores_receitas').locator('xpath=..'),
    ).toHaveAttribute('href', '/terminal?headerPreset=maiores_receitas');
    await expect(
      page
        .getByTestId('ver-ranking-btn-maiores_valor_mercado')
        .locator('xpath=..'),
    ).toHaveAttribute('href', '/terminal?headerPreset=maiores_valor_mercado');

    const newsSection = page.getByTestId('market-news-section');
    await expect(newsSection).toBeVisible();
    const firstNewsCard = page.getByTestId('market-news-card').first();
    await expect(firstNewsCard).toBeVisible({ timeout: 15000 });
    await expect(firstNewsCard).toHaveAttribute('href', /^https?:\/\//);
    await expect(firstNewsCard.locator('img')).toBeVisible();

    const heroExplore = page.getByTestId('hero-explore-button');
    await expect(heroExplore).toBeVisible();
  });

  test('renders terminal market summary cards and enforces zero CSS gradients on terminal', async ({
    page,
  }) => {
    await page.goto('/terminal');

    const totalStocksEl = page.getByTestId('summary-total-stocks');
    await expect(totalStocksEl).toBeVisible({ timeout: 15000 });
    const totalCount = Number(await totalStocksEl.innerText());
    expect(totalCount).toBeGreaterThanOrEqual(30);

    await expect(page.getByTestId('summary-bazin-count')).toBeVisible();
    await expect(page.getByTestId('summary-graham-count')).toBeVisible();

    const gradientElements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*')).filter((el) => {
        const bg = window.getComputedStyle(el).backgroundImage;
        return bg && bg.includes('gradient');
      }).length;
    });
    expect(gradientElements).toBe(0);
  });
});
