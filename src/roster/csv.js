/**
 * BloomType — CSV roster adapter. The fallback every school can use: export
 * a class list from any student information system, or type one in a
 * spreadsheet, and upload it on the teacher page.
 *
 * Accepted columns (header row, any order, case-insensitive, EN/FR/ES):
 *   name | display name | student            one full name per row
 *   first name + last name                    (or given/family name)
 *   id | student id | student number         optional; made from the name
 * Email columns are ignored, and a cell holding an email is never kept.
 * Commas, semicolons (French and Spanish Excel) and tabs all work.
 */
import { RosterImportError, nameKey } from './importer.js';

const HEADERS = {
  name: ['name', 'display name', 'displayname', 'student', 'student name', 'full name', 'nom', 'élève', 'eleve', 'nombre', 'alumno', 'estudiante'],
  first: ['first name', 'firstname', 'given name', 'givenname', 'prénom', 'prenom', 'nombre de pila'],
  last: ['last name', 'lastname', 'family name', 'familyname', 'surname', 'nom de famille', 'apellido', 'apellidos'],
  id: ['id', 'student id', 'studentid', 'student number', 'sis id', 'external id', 'externalid', 'numéro', 'numero', 'matricule', 'identifiant', 'número', 'matrícula', 'matricula'],
};

/** Split CSV text into rows of cells (RFC 4180 quoting). */
export function parseCSV(text, delimiter) {
  const source = String(text ?? '').replace(/^\ufeff/u, '');
  const sep = delimiter || detectDelimiter(source);
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function detectDelimiter(source) {
  const firstLine = source.split(/\r?\n/u, 1)[0] || '';
  const counts = [',', ';', '\t'].map((sep) => [sep, firstLine.split(sep).length - 1]);
  return counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ',';
}

function columnIndex(header, names) {
  return header.findIndex((cell) => names.includes(nameKey(cell).replace(/[_-]+/gu, ' ')) || names.includes(cell.trim().toLowerCase()));
}

function slug(name) {
  return nameKey(name).replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'student';
}

/**
 * Turn a CSV file's text into the provider-neutral import shape. Rows with
 * no id get a stable one made from the name, so a re-upload updates rather
 * than duplicates them.
 */
export function rosterFromCSV(text, { externalClassId = null } = {}) {
  const rows = parseCSV(text);
  if (!rows.length) throw new RosterImportError('empty-file');
  const header = rows[0];
  const cols = {
    name: columnIndex(header, HEADERS.name),
    first: columnIndex(header, HEADERS.first),
    last: columnIndex(header, HEADERS.last),
    id: columnIndex(header, HEADERS.id),
  };
  const hasHeader = Object.values(cols).some((index) => index >= 0);
  // A file with no recognised header is read as one name per row.
  if (!hasHeader) cols.name = 0;
  const body = hasHeader ? rows.slice(1) : rows;

  const usedIds = new Map();
  const students = body.map((row) => {
    const cell = (index) => (index >= 0 ? (row[index] ?? '').trim() : '');
    const student = cols.first >= 0 || cols.last >= 0
      ? { givenName: cell(cols.first) || cell(cols.name), familyName: cell(cols.last) }
      : { displayName: cell(cols.name) };
    let externalId = cell(cols.id);
    if (!externalId) {
      const base = `csv-${slug(student.displayName || `${student.givenName} ${student.familyName}`)}`;
      const n = (usedIds.get(base) || 0) + 1;
      usedIds.set(base, n);
      externalId = n === 1 ? base : `${base}-${n}`;
    }
    return { ...student, externalId };
  });
  return { provider: 'csv', externalClassId, students };
}

export const csvAdapter = {
  id: 'csv',
  requiresPartner: false,
  isConfigured: () => true,
  /** CSV has no class list: the teacher picks a file for the open class. */
  async listClasses() { return []; },
  async fetchRoster(_externalClassId, { text } = {}) { return rosterFromCSV(text); },
};
