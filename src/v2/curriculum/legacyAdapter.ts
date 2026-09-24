/** V1 compatibility gate. Historical source arrays are retained; assessed output is filtered. */
const V1_HOME = 'asdfjkl;';
const V1_UPPER = 'qwertyuiop';
const V1_LOWER = 'zxcvbnm';
const V1_REMAINING = 'gh';
const V1_CAPITALS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const V1_NUMBERS = '0123456789';

export function getLegacyAllowedCharacters(level: number): ReadonlySet<string> {
  if (!Number.isInteger(level) || level < 1 || level > 10) throw new Error(`Invalid legacy lesson level ${level}`);
  const keys = [' ', ...V1_HOME];
  if (level >= 2) keys.push(...V1_UPPER);
  if (level >= 3) keys.push(...V1_LOWER);
  if (level >= 4) keys.push(...V1_REMAINING);
  if (level >= 5) keys.push(...V1_CAPITALS);
  if (level >= 6) keys.push(...V1_NUMBERS);
  return new Set(keys);
}

export function isLegacyItemAllowed(text: string, level: number): boolean {
  const keys = getLegacyAllowedCharacters(level);
  return text.length > 0 && [...text].every((char) => keys.has(char));
}

export interface LegacyContentInput {
  readonly words: readonly string[];
  readonly sentences: readonly string[];
  readonly practicePatterns: readonly string[];
}

export function filterLegacyContent(level: number, source: LegacyContentInput): LegacyContentInput {
  const filter = (values: readonly string[]): string[] => values.filter((value) => isLegacyItemAllowed(value, level));
  const safe = {
    words: filter(source.words),
    sentences: filter(source.sentences),
    practicePatterns: filter(source.practicePatterns),
  };
  if (safe.words.length === 0) throw new Error(`Legacy lesson ${level} has no curriculum-safe words`);
  return safe;
}

/** Use for newly authored content; historical banks go through the compatibility filter. */
export function assertLegacyContentAllowed(level: number, source: LegacyContentInput): void {
  for (const [kind, values] of Object.entries(source) as [keyof LegacyContentInput, readonly string[]][]) {
    for (const [index, value] of values.entries()) {
      if (!isLegacyItemAllowed(value, level)) throw new Error(`Legacy lesson ${level} ${kind}[${index}] assesses an unintroduced key: ${value}`);
    }
  }
}

export function getLegacyContentAudit(level: number, source: LegacyContentInput): Readonly<Record<keyof LegacyContentInput, { total: number; rejected: number }>> {
  const count = (values: readonly string[]) => ({ total: values.length, rejected: values.filter((value) => !isLegacyItemAllowed(value, level)).length });
  return { words: count(source.words), sentences: count(source.sentences), practicePatterns: count(source.practicePatterns) };
}
