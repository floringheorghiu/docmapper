import { promises as fs } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyFiles() {
  // Create output directory
  const outputDir = join('dist', 'output');
  try {
    await fs.mkdir(outputDir, { recursive: true });

    // Copy files
    await fs.copyFile(
      join('dist', 'plugin.js'),
      join(outputDir, 'plugin.js')
    );

    await fs.copyFile(
      join('dist', 'index.html'),
      join(outputDir, 'index.html')
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

copyFiles(); 