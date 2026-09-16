#!/usr/bin/env node
// Stoxly MCP server (stdio). Exposes the same three tools as the hosted
// Streamable HTTP endpoint (https://www.stoxlyonline.com/api/mcp) for clients
// and platforms that run MCP servers as a local process.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API_BASE = process.env.STOXLY_API_BASE || 'https://www.stoxlyonline.com';
const REQUEST_TIMEOUT_MS = 45_000;

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.\-^=]{0,14}$/;
const CRYPTO_SYMBOL_PATTERN = /^[A-Z0-9]{1,12}$/;

const symbolSchema = z
  .string()
  .describe('Ticker symbol in Yahoo Finance format, e.g. AAPL, BRK-B, SAP.DE, VOO');

const cryptoSymbolSchema = z
  .string()
  .describe('Crypto ticker symbol, e.g. BTC, ETH, SOL (a -USD suffix is accepted)');

// Same normalization as the hosted endpoint: trim, uppercase, strip -USD/-USDT.
function normalizeCryptoSymbol(symbol) {
  return symbol.trim().toUpperCase().replace(/-(USD|USDT)$/, '');
}

function jsonContent(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function errorContent(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

async function analyze(type, symbol) {
  const sym = type === 'crypto' ? normalizeCryptoSymbol(symbol) : symbol.trim().toUpperCase();
  const pattern = type === 'crypto' ? CRYPTO_SYMBOL_PATTERN : SYMBOL_PATTERN;
  if (!pattern.test(sym)) {
    return errorContent(
      `"${symbol}" is not a valid ${type === 'crypto' ? 'crypto' : 'ticker'} symbol.`
    );
  }
  const url = `${API_BASE}/api/analyze?type=${type}&symbol=${encodeURIComponent(sym)}`;
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'stoxly-mcp/1.1.0' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body || body.error) {
      const reason = body?.error || `HTTP ${res.status}`;
      return errorContent(`Analysis failed for ${sym}: ${reason}`);
    }
    return jsonContent(body);
  } catch (error) {
    return errorContent(
      `Analysis failed for ${sym}: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
}

const server = new McpServer({ name: 'stoxly', version: '1.1.0' });

server.registerTool(
  'analyze_stock',
  {
    title: 'Analyze stock fundamentals',
    description:
      "Free fundamental analysis of a publicly traded stock. Scores the company against Stoxly's 10-point checklist (P/E, PEG, price/book, revenue growth, ROE, operating margin, return on assets, quick ratio, debt/equity, free cash flow yield) and returns the score, a descriptive verdict, every metric value and a link to the full analysis page. null means a metric was unavailable — never treat it as 0.",
    inputSchema: { symbol: symbolSchema },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ symbol }) => analyze('stock', symbol)
);

server.registerTool(
  'analyze_etf',
  {
    title: 'Analyze ETF',
    description:
      "Free analysis of a US-listed ETF. Scores the fund against Stoxly's 10-point checklist (expense ratio, fund size, fund age, number of holdings, top-10 weight, top sector weight, volatility, 1/3/5-year returns) and returns the score, a descriptive verdict, every metric value and a link to the full analysis page. Fund stats are usually only available for US-listed ETFs.",
    inputSchema: { symbol: symbolSchema },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ symbol }) => analyze('etf', symbol)
);

server.registerTool(
  'analyze_crypto',
  {
    title: 'Analyze crypto-asset',
    description:
      "Free analysis of a crypto-asset (coin or token). Scores it against Stoxly's 10-point crypto checklist (market cap, market cap rank, 24h volume/market cap, exchange count, supply issued, project age, developer commits, volatility, 1-year and 3-year returns) and returns the score, a descriptive verdict, every metric value and a link to the full analysis page.",
    inputSchema: { symbol: cryptoSymbolSchema },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  ({ symbol }) => analyze('crypto', symbol)
);

const transport = new StdioServerTransport();
await server.connect(transport);
