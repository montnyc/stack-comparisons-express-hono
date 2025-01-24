import { getPackageSize } from 'package-size';
import { writeFileSync } from 'node:fs';

async function main() {
  const results = {
    timestamp: new Date().toISOString(),
    legacy: {
      dependencies: await getPackageSize('./legacy/package.json'),
    },
    modern: {
      dependencies: await getPackageSize('./modern/package.json'),
    }
  };

  // Add build size comparison when available
  try {
    results.legacy.build = await getPackageSize('./legacy/dist');
    results.modern.build = await getPackageSize('./modern/dist');
  } catch (error) {
    console.warn('Build directories not found. Run builds first for complete comparison.');
  }

  writeFileSync(
    'benchmark/results/size-comparison.json',
    JSON.stringify(results, null, 2)
  );

  console.log('\nSize Comparison Results:');
  console.table({
    'Legacy Dependencies': formatSize(results.legacy.dependencies),
    'Modern Dependencies': formatSize(results.modern.dependencies),
    'Legacy Build': results.legacy.build ? formatSize(results.legacy.build) : 'N/A',
    'Modern Build': results.modern.build ? formatSize(results.modern.build) : 'N/A'
  });
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

main().catch(console.error); 