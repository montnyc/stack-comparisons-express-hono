import autocannon from 'autocannon';
import { writeFileSync } from 'fs';

const DURATION = 30; // seconds

const endpoints = [
  { name: 'Legacy Express', url: 'http://localhost:3000' },
  { name: 'Modern Hono', url: 'http://localhost:3001' }
];

const scenarios = [
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Item' })
  }
];

async function runBenchmark(endpoint, scenario) {
  const url = `${endpoint.url}${scenario.path}`;
  const instance = autocannon({
    url,
    method: scenario.method,
    headers: scenario.headers,
    body: scenario.body,
    duration: DURATION,
    connections: 100
  });

  const result = await instance;
  return {
    endpoint: endpoint.name,
    scenario: scenario.name,
    ...result
  };
}

async function main() {
  const results = [];

  for (const endpoint of endpoints) {
    for (const scenario of scenarios) {
      console.log(`Benchmarking ${endpoint.name} - ${scenario.name}...`);
      const result = await runBenchmark(endpoint, scenario);
      results.push(result);
      // Wait a bit between tests to let servers cool down
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    duration: DURATION,
    results: results.map(r => ({
      endpoint: r.endpoint,
      scenario: r.scenario,
      requestsPerSecond: r.requests.average,
      latencyAvg: r.latency.average,
      latencyP99: r.latency.p99,
      throughput: r.throughput.average
    }))
  };

  writeFileSync(
    'benchmark/results/api-benchmark.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\nBenchmark Results:');
  console.table(report.results);
}

// Ensure both servers are running before starting
setTimeout(main, 1000); 