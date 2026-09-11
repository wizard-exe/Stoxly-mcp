// Starts the server over stdio, lists the tools and checks that an invalid
// symbol is rejected without a network call. Run with `npm test`.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({ name: 'stoxly-smoke', version: '1.0.0' });
await client.connect(
  new StdioClientTransport({ command: process.execPath, args: ['server.js'] })
);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
if (names.join(',') !== 'analyze_etf,analyze_stock') {
  throw new Error(`unexpected tools: ${names.join(', ')}`);
}

const invalid = await client.callTool({ name: 'analyze_stock', arguments: { symbol: '???' } });
if (!invalid.isError) {
  throw new Error('invalid symbol was not rejected');
}

await client.close();
console.log('ok: 2 tools listed, invalid symbol rejected');
