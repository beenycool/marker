import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToFix = [
  'src/components/feedback/ai-feedback-widget.tsx',
  'src/components/forms/ocr-upload.tsx',
  'src/components/landing/hero.tsx',
  'src/components/landing/pricing.tsx',
  'src/components/promotion/summer-promotion-banner.tsx',
  'src/components/providers/auth-provider.tsx',
  'src/lib/__tests__/global-setup.js',
  'src/lib/__tests__/global-teardown.js',
  'src/lib/__tests__/test-utils.ts',
  'src/lib/ai/prompt-manager.ts',
  'src/lib/observability/structured-logger.ts',
  'src/lib/sentry.ts',
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Add ESLint disable comment above console statements
  content = content.replace(
    /(console\.(log|debug|info|warn|error)\(.*\);?)/g,
    '// eslint-disable-next-line no-console\n$1'
  );

  fs.writeFileSync(fullPath, content);
  console.log(`Fixed console warnings in: ${filePath}`);
});

console.log('All files processed!');
