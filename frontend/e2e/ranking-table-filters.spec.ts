import { test, expect } from '@playwright/test';

test.describe('B3 Stocks Ranking Table, Dark Theme and Indicator Tooltips', () => {
  test('verifies dark theme, filters, indicator tooltips and custom columns in terminal', async ({
    page,
  }) => {
    await page.goto('/terminal');

    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveClass(/dark/);

    await expect(page.getByTestId('header-preset-all')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('header-preset-revenue')).toBeVisible();
    await expect(page.getByTestId('header-preset-marketcap')).toBeVisible();

    await page.getByTestId('header-preset-revenue').click();
    await expect(page.getByTestId('sort-select')).toHaveValue(
      'maiores_receitas',
    );

    await page.getByTestId('header-preset-all').click();
    await expect(page.getByTestId('sort-select')).toHaveValue('valor_mercado');

    const chipBancos = page.getByTestId('category-chip-Bancos');
    const chipEnergia = page.getByTestId('category-chip-Energia Elétrica');
    await chipBancos.click();
    await chipEnergia.click();
    await expect(page.getByTestId('clear-categories-btn')).toBeVisible();
    await page.getByTestId('clear-categories-btn').click();

    await page.getByTestId('sort-select').click();
    await page.getByTestId('sort-option-graham').click();
    await expect(page.getByTestId('header-sort-btn-grahamMargin')).toContainText(
      '(Upside de Graham)',
    );
    await expect(page.getByText('Ordenar Colunas:')).toHaveCount(0);

    const infoBtnPl = page.getByTestId('info-btn-pl');
    await expect(infoBtnPl).toBeVisible();
    await infoBtnPl.click();
    const tooltipPl = page.getByTestId('tooltip-content-pl');
    await expect(tooltipPl).toBeVisible();
    await expect(tooltipPl).toContainText('Mostra quantos anos de lucro');

    await page.getByTestId('customize-button').click();
    const customizePanel = page.getByTestId('customize-panel');
    await expect(customizePanel).toBeVisible();
    await expect(page.getByTestId('config-small-caps')).toBeVisible();
    await expect(page.getByTestId('config-one-per-company')).toBeVisible();
    await page.getByTestId('custom-col-roe').click();
    await expect(page.getByTestId('header-sort-btn-roe')).toBeVisible();

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('PETR4');

    const petrRow = page.getByTestId('stock-row-PETR4');
    await expect(petrRow).toBeVisible({ timeout: 10000 });
    await expect(petrRow).toContainText('PETR4');
    await expect(petrRow).toHaveClass(/h-16/);
    await expect(petrRow).not.toContainText('x');

    const companyLogo = page.getByTestId('company-logo-PETR4');
    await expect(companyLogo.first()).toBeVisible();
  });
});
