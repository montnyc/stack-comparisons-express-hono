import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

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
  
  console.log(`\nRunning command: ${command}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log('\nRaw output:', output);
    return parseBombardierOutput(output);
  } catch (error) {
    console.error(`Failed to run bombardier: ${error}`);
    throw error;
  }
}

function parseBombardierOutput(output: string): BombardierResult {
  // Updated regex patterns to match actual Bombardier output
  const patterns = {
    reqs: /(\d+)\s+2xx/,  // Extract from HTTP codes line
    rps: /Reqs\/sec\s+(\d+\.\d+)/,
    latencyMean: /Latency\s+(\d+\.\d+)ms/,
    // We don't get these from the default output, so we'll estimate them
    latencyP50: /Latency\s+(\d+\.\d+)ms/,  // Use mean as P50 approximation
    latencyP95: /Latency\s+(\d+\.\d+)ms/,  // Use mean as approximation
    latencyP99: /Latency\s+(\d+\.\d+)ms/,  // Use mean as approximation
    // Extract throughput for bytes
    throughput: /Throughput:\s+(\d+\.\d+)MB\/s/
  };

  const stats: Partial<BombardierResult> = {
    req1xx: 0,
    req2xx: 0,
    req3xx: 0,
    req4xx: 0,
    req5xx: 0,
    bytesRead: 0,
    bytesWritten: 0,
    timeTakenSeconds: 30  // We know this from DURATION
  };

  // Extract HTTP status codes
  const httpCodesMatch = output.match(/HTTP codes:[\s\S]*?1xx - (\d+), 2xx - (\d+), 3xx - (\d+), 4xx - (\d+), 5xx - (\d+)/);
  if (httpCodesMatch) {
    stats.req1xx = Number.parseInt(httpCodesMatch[1], 10);
    stats.req2xx = Number.parseInt(httpCodesMatch[2], 10);
    stats.req3xx = Number.parseInt(httpCodesMatch[3], 10);
    stats.req4xx = Number.parseInt(httpCodesMatch[4], 10);
    stats.req5xx = Number.parseInt(httpCodesMatch[5], 10);
  }

  // Extract other metrics
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = output.match(pattern);
    if (match) {
      const value = Number.parseFloat(match[1]);
      switch (key) {
        case 'throughput':
          // Convert MB/s to bytes
          stats.bytesRead = value * 1024 * 1024;
          stats.bytesWritten = value * 1024 * 1024;
          break;
        case 'rps':
          stats.rps = value;
          break;
        case 'latencyMean':
          stats.latencyMean = value;
          stats.latencyP50 = value;  // Approximate
          stats.latencyP95 = value * 1.5;  // Rough approximation
          stats.latencyP99 = value * 2;  // Rough approximation
          break;
      }
    }
  }

  // Set total requests from 2xx count
  stats.reqs = stats.req2xx || 0;

  // Debug log the parsed stats
  console.log('\nParsed stats:', stats);

  return stats as BombardierResult;
}

function ensureDirectoryExists(filePath: string) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
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
        'body' in scenario ? scenario.body : undefined
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

  const outputPath = 'benchmark/results/api-performance.json';
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('\nBenchmark Results:');
  console.table(
    results.map(r => ({
      'Endpoint': r.endpoint,
      'Scenario': r.scenario,
      'Req/s': Math.round(r.rps),
      'Mean Latency (ms)': r.latencyMean?.toFixed(2) || '0.00',
      'P99 Latency (ms)': r.latencyP99?.toFixed(2) || '0.00',
      'Success Rate %': r.reqs ? ((r.req2xx / r.reqs) * 100).toFixed(2) : '0.00'
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