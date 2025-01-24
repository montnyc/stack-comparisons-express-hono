# Stack Performance Comparison: Legacy vs Modern Node.js

This repository contains two identical API applications implemented with different technology stacks to compare their performance characteristics.

## Project Structure

- `/legacy` - Traditional Express.js Stack

  - TypeScript
  - Express.js
  - npm
  - ESLint + Prettier
  - Jest

- `/modern` - Modern Hono Stack
  - Hono with Zod validation
  - pnpm
  - SWC (fast compilation)
  - Biome
  - tsx
  - Vitest

## Prerequisites

```bash
# Install required tools
brew install hyperfine  # For build time comparison
curl -OL https://github.com/codesenberg/bombardier/releases/download/v1.2.5/bombardier-darwin-amd64 && \
chmod +x bombardier-darwin-amd64 && \
sudo mv bombardier-darwin-amd64 /usr/local/bin/bombardier  # For API performance testing
```

## Installation

```bash
# Install all dependencies
pnpm install
```

## Development

Start both servers in development mode:

```bash
pnpm run start:all
```

Or run them individually:

```bash
pnpm run dev:legacy  # Express.js on port 3000
pnpm run dev:modern  # Hono on port 3001
```

## API Endpoints

Both servers implement identical endpoints:

- `GET /` - Hello world message
- `GET /api/items` - Returns a list of 10 items
- `POST /api/items` - Creates a new item
  ```bash
  curl -X POST http://localhost:3000/api/items -H "Content-Type: application/json" -d '{"name":"Test Item"}'
  ```

## Performance Testing

### 1. Build Time Comparison

Measures the time taken to compile TypeScript to JavaScript:

```bash
pnpm run benchmark:build
```

This runs multiple builds with warmup cycles and outputs detailed statistics.

### 2. API Performance Testing

Tests throughput, latency, and success rates for all endpoints:

```bash
# Start both servers first
pnpm run start:all

# In a new terminal, run the benchmarks
pnpm run benchmark:api
```

The API benchmark:

- Tests each endpoint with 100 concurrent connections
- Runs for 30 seconds per endpoint
- Measures requests/second, latency (mean, p50, p95, p99), and success rates
- Saves detailed results to `benchmark/results/api-performance.json`

### 3. Run All Benchmarks

To run both build and API benchmarks:

```bash
pnpm run benchmark
```

## Results

Results are saved in JSON format in the `benchmark/results/` directory:

- `build-times.json` - Build performance metrics
- `api-performance.json` - API performance metrics

Example metrics collected:

- Build times
- Requests per second
- Latency percentiles
- Memory usage
- Success rates
- Bundle sizes

## Key Differences

### Legacy Stack (Express.js)

- Traditional TypeScript compilation
- Runtime type checking via TypeScript
- Mature ecosystem
- Larger bundle size

### Modern Stack (Hono)

- SWC for fast compilation
- Runtime type safety with Zod
- Smaller bundle size
- Modern tooling (Biome, tsx)
- Built for edge computing

## Purpose

This project aims to demonstrate the performance differences between a traditional Node.js setup and a modern, optimized stack. Both implementations provide identical functionality, allowing for direct comparisons in:

- Build times
- Runtime performance
- Bundle sizes
- Developer experience
- Memory usage
- Request handling capacity

## Getting Started

### Legacy Stack

```bash
cd legacy
npm install
npm run dev
```

### Modern Stack

```bash
cd modern
pnpm install
pnpm dev
```
