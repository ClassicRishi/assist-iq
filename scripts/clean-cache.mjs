import { rmSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';

function externalCachePath() {
  if (platform() === 'win32') {
    return join(homedir(), 'AppData', 'Local', 'AngularCache', 'hospital-management');
  }

  return join(homedir(), '.cache', 'angular', 'hospital-management');
}

const targets = [
  '.angular/cache',
  'node_modules/.vite',
  externalCachePath(),
];

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* wait for file locks to release */
  }
}

function removeWithRetry(target, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      console.log(`Cleared ${target}`);
      return;
    } catch (error) {
      if (i === attempts - 1) {
        console.warn(`Could not clear ${target}: ${error.message}`);
        console.warn('Stop "ng serve", close the browser tab, then run clean:cache again.');
      } else {
        sleep(400);
      }
    }
  }
}

console.log('Stopping stale caches (close ng serve first if this fails)...\n');

for (const target of targets) {
  removeWithRetry(target);
}

console.log('\nDone. Run: npm start');
