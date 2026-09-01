import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.map', '.txt', '.webmanifest']);
const CLOUD_MARKERS = [
  { label: 'Supabase project URL', pattern: /https?:\/\/[^\s"']+\.supabase\.co\b/iu },
  { label: 'Supabase Vite configuration name', pattern: /VITE_SUPABASE_(?:URL|ANON_KEY)/u },
  { label: 'Supabase client bundle', pattern: /@supabase\/supabase-js|GoTrueClient|SupabaseClient/u },
];

function extension(path) {
  const index = path.lastIndexOf('.');
  return index === -1 ? '' : path.slice(index).toLowerCase();
}

function listTextArtifacts(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listTextArtifacts(path);
    return entry.isFile() && TEXT_EXTENSIONS.has(extension(entry.name)) ? [path] : [];
  });
}

export function verifyLocalOnlyBuild(directory = 'dist') {
  const root = resolve(directory);
  if (!statSync(root).isDirectory()) throw new Error(`Build directory is not a directory: ${root}`);

  const violations = [];
  for (const path of listTextArtifacts(root)) {
    const source = readFileSync(path, 'utf8');
    for (const marker of CLOUD_MARKERS) {
      if (marker.pattern.test(source)) violations.push(`${marker.label} in ${path.slice(root.length + 1)}`);
    }
  }

  if (violations.length > 0) {
    throw new Error(`Local-only build verification failed:\n- ${violations.join('\n- ')}`);
  }

  return { artifactCount: listTextArtifacts(root).length, root };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const result = verifyLocalOnlyBuild(process.argv[2]);
  console.log(`Local-only build verified across ${result.artifactCount} text artifacts.`);
}
