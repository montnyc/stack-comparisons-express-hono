import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

interface BombardierResult {
  bytesRead: number;
  bytesWritten: number;
  timeTakenSeconds: number;
  req1xx: number;
  req2xx: number;
  req3xx: number;
  req4xx: number;
  req5xx: number;
  latencyMean: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  rps: number;
  reqs: number;
}

const DURATION = '30s';
const CONNECTIONS = 100;
const ENDPOINTS = [
  { name: 'Legacy Express', url: 'http://localhost:3000' },
  { name: 'Modern Hono', url: 'http://localhost:3001' }
] as const;

const SCENARIOS = [
  {
    name: 'GET /',
    method: 'GET',
    path: '/'
  },
  {
    name: 'GET /api/items',
    method: 'GET',
    path: '/api/items'
  },
  {
    name: 'POST /api/items',
    method: 'POST',
    path: '/api/items',
    body: JSON.stringify({ name: 'Test Item' })
  }
] as const;

function runBombardier(url: string, method: string, body?: string): BombardierResult {
  const bodyFlag = body ? `-b '${body}' -H 'Content-Type: application/json'` : '';
  const command = `bombardier -c ${CONNECTIONS} -d ${DURATION} -m ${method} ${bodyFlag} ${url}`;
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return parseBombardierOutput(output);
  } catch (error) {
    console.error(`Failed to run bombardier: ${error}`);
    throw error;
  }
}

function parseBombardierOutput(output: string): BombardierResult {
  // Extract key metrics using regex
  const stats = {
    bytesRead: extractNumber(output, /Bytes read:\s+(\d+)/),
    bytesWritten: extractNumber(output, /Bytes written:\s+(\d+)/),
    timeTakenSeconds: extractNumber(output, /Time taken for tests:\s+([\d.]+)\s+seconds/),
    req1xx: extractNumber(output, /1xx - (\d+)/),
    req2xx: extractNumber(output, /2xx - (\d+)/),
    req3xx: extractNumber(output, /3xx - (\d+)/),
    req4xx: extractNumber(output, /4xx - (\d+)/),
    req5xx: extractNumber(output, /5xx - (\d+)/),
    latencyMean: extractNumber(output, /mean:\s+([\d.]+)ms/),
    latencyP50: extractNumber(output, /50%:\s+([\d.]+)ms/),
    latencyP95: extractNumber(output, /95%:\s+([\d.]+)ms/),
    latencyP99: extractNumber(output, /99%:\s+([\d.]+)ms/),
    rps: extractNumber(output, /Reqs\/sec:\s+([\d.]+)/),
    reqs: extractNumber(output, /(\d+)\s+requests in/),
  };

  return stats;
}

function extractNumber(text: string, pattern: RegExp): number {
  const match = text.match(pattern);
  return match ? parseFloat(match[1]) : 0;
}

async function main() {
  const results = [];

  for (const endpoint of ENDPOINTS) {
    for (const scenario of SCENARIOS) {
      console.log(`\nBenchmarking ${endpoint.name} - ${scenario.name}...`);
      
      // Wait a bit before starting next test
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const result = runBombardier(
        endpoint.url + scenario.path,
        scenario.method,
        scenario.body
      );

      results.push({
        endpoint: endpoint.name,
        scenario: scenario.name,
        ...result
      });
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    duration: DURATION,
    connections: CONNECTIONS,
    results
  };

  writeFileSync(
    'benchmark/results/api-performance.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\nBenchmark Results:');
  console.table(
    results.map(r => ({
      'Endpoint': r.endpoint,
      'Scenario': r.scenario,
      'Req/s': Math.round(r.rps),
      'Mean Latency (ms)': r.latencyMean.toFixed(2),
      'P99 Latency (ms)': r.latencyP99.toFixed(2),
      'Success Rate %': ((r.req2xx / r.reqs) * 100).toFixed(2)
    }))
  );
}

// Check if bombardier is installed
try {
  execSync('which bombardier', { stdio: 'ignore' });
} catch {
  console.error('\nError: bombardier is not installed. Please install it first:');
  console.error('brew install bombardier  # macOS');
  console.error('# or download from https://github.com/codesenberg/bombardier/releases');
  process.exit(1);
}

// Ensure both servers are running before starting
setTimeout(() => {
  main().catch(console.error);
}, 1000); 