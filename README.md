# Stoxly MCP Server

Free fundamental analysis of stocks and ETFs for AI agents, powered by [Stoxly](https://www.stoxlyonline.com).

Stoxly evaluates any publicly traded company against a 10-point fundamental checklist (P/E, PEG, price/book, revenue growth, ROE, operating margin, return on assets, quick ratio, debt/equity, free cash flow yield) — and any US-listed ETF against 10 fund criteria (expense ratio, fund size, fund age, holdings, concentration, volatility, 1/3/5-year returns). Each analysis returns a 0–10 score, a descriptive verdict, every underlying metric and a link to the full analysis page.

This is a **remote MCP server** — nothing to install or run locally.

**Docs:** https://www.stoxlyonline.com/mcp

## Endpoint

```
https://www.stoxlyonline.com/api/mcp
```

- Transport: Streamable HTTP
- Authentication: none
- Rate limit: 30 tool calls per IP per hour

## Tools

### `analyze_stock`

Fundamental analysis of a publicly traded stock.

| Argument | Type | Description |
|---|---|---|
| `symbol` | string | Ticker in Yahoo Finance format, e.g. `AAPL`, `BRK-B`, `SAP.DE` |

Returns: company name, price, `score` (criteria met out of 10), `verdict`, per-criterion `checks`, all metric values, and the canonical analysis URL. `null` means a metric was unavailable — never treat it as 0.

### `analyze_etf`

Analysis of a US-listed ETF.

| Argument | Type | Description |
|---|---|---|
| `symbol` | string | Ticker in Yahoo Finance format, e.g. `VOO`, `QQQ`, `SCHD` |

Returns: fund name, price, `score`, `verdict`, per-criterion `checks`, all metric values, and the canonical analysis URL.

## Setup

### Claude Code

```bash
claude mcp add --transport http stoxly https://www.stoxlyonline.com/api/mcp
```

### Claude (Desktop / claude.ai)

Settings → Connectors → **Add custom connector** → URL: `https://www.stoxlyonline.com/api/mcp`

### Cursor / other MCP clients

```json
{
  "mcpServers": {
    "stoxly": {
      "url": "https://www.stoxlyonline.com/api/mcp"
    }
  }
}
```

## Example

> "Analyze AAPL's fundamentals"

The agent calls `analyze_stock` with `{"symbol": "AAPL"}` and receives:

```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "score": "7/10 criteria met",
  "verdict": "Strong Fundamentals",
  "checks": { "revenueGrowth": true, "peRatio": false, "...": "..." },
  "metrics": { "peRatio": 33.2, "roe": 104.2, "...": "..." },
  "url": "https://www.stoxlyonline.com/analysis/AAPL"
}
```

## Data & methodology

Data is aggregated from Financial Modeling Prep, Yahoo Finance, Finnhub and Alpha Vantage, plus official regulatory filings (SEC EDGAR for US filers, ESEF/UKSEF via filings.xbrl.org for Europe/UK). Scoring thresholds are documented at [stoxlyonline.com/about](https://www.stoxlyonline.com/about) and in [llms-full.txt](https://www.stoxlyonline.com/llms-full.txt).

## Disclaimer

For educational purposes only — not financial advice. Data may be delayed.
