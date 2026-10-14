/**
 * BloomType — teacher page, online classes (pilot builds only).
 *
 * Loaded by teacher.js only when VITE_CLOUD_CLASS_LOGIN is 'true', so none
 * of this (and no Supabase code) is in the public build. Adds:
 *   - "Sign in with Google" (Supabase Auth) beside the PIN, which stays the
 *     fallback and still guards the progress saved on this device;
 *   - a class switcher with create, rename and archive;
 *   - per-class reports through the page's existing table and exports;
 *   - roster import (Google Classroom, CSV; ClassLink and Clever later);
 *   - the school admin overview (aggregates only).
 */
import { getTeacherSupabase } from './teacherAuth.js';
import { escapeHTML } from './utils.js';
import { formatNumber } from './i18n.js';
import { pageT } from './pageTranslations.js';
import {
  claimTeacherRole,
  createCloudClass,
  fetchCloudClassReport,
  fetchRosterByCode,
  fetchSchoolSummary,
  getTeacherSession,
  importRosterToClass,
  inviteTeacher,
  listMyClasses,
  renameCloudClass,
  setCloudClassArchived,
  signInWithGoogle,
  signOutTeacher,
  teacherRedirectUrl,
} from './teacherCloud.js';
import { adminRows, classesForSwitcher, pickSelectedClass, summarizeSchool } from './teacherDashboard.js';
import { normalizeRosterImport } from './roster/importer.js';
import { rosterFromCSV } from './roster/csv.js';
import { createRosterProvider } from './roster/providers.js';

const $ = (id) => document.getElementById(id);
const SELECTED_KEY = 'bloomtype-cloud-class';
const RETURN_KEY = 'bloomtype-cloud-import-class';

const state = {
  sb: null,
  host: null,
  session: null,
  role: null,
  classes: [],
  selectedId: null,
  showArchived: false,
};

function storageGet(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}
function storageSet(storage, key, value) {
  try {
    if (value == null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch { /* storage can be blocked; nothing depends on it */ }
}

function say(id, key, values) {
  const el = $(id);
  if (el) el.textContent = key ? pageT(key, values) : '';
}

function errorKey(error) {
  switch (error?.code) {
    case 'auth-expired':
    case 'auth-required': return 'teacher.cloud.googleExpired';
    case 'scope-missing': return 'teacher.cloud.scopeMissing';
    case 'empty-file': return 'teacher.cloud.emptyFile';
    default: return 'teacher.cloud.error';
  }
}

function selectedClass() {
  return state.classes.find((c) => c.id === state.selectedId) || null;
}

// ===== Sign-in =====
async function startGoogleSignIn() {
  say('cloud-signin-status', 'teacher.cloud.opening');
  say('cloud-status', 'teacher.cloud.opening');
  try {
    await signInWithGoogle(state.sb, { redirectTo: teacherRedirectUrl(window.location.href) });
  } catch {
    say('cloud-signin-status', 'teacher.cloud.error');
    say('cloud-status', 'teacher.cloud.error');
  }
}

function resetCloudView() {
  state.session = null;
  state.role = null;
  state.host.setRosterReader(null);
  state.classes = [];
  $('cloud-classes').hidden = true;
  $('admin-panel').hidden = true;
  $('admin-body').replaceChildren();
  $('btn-cloud-signin').hidden = false;
  $('btn-cloud-signout').hidden = true;
  $('cloud-intro').hidden = false;
  $('cloud-teacher-name').textContent = '';
  $('google-course-list').replaceChildren();
  say('cloud-status');
  say('import-status');
}

async function refreshSession() {
  const session = await getTeacherSession(state.sb).catch(() => null);
  if (!session) {
    resetCloudView();
    return;
  }
  state.session = session;
  let role;
  try {
    role = await claimTeacherRole(state.sb, session.displayName);
  } catch {
    say('cloud-signin-status', 'teacher.cloud.error');
    say('cloud-status', 'teacher.cloud.error');
    return;
  }
  if (!role) {
    // Signed in, but no invite: nothing was created, so sign straight out
    // and say how to get access.
    try { await signOutTeacher(state.sb); } catch { /* local sign-out only */ }
    resetCloudView();
    say('cloud-signin-status', 'teacher.cloud.notInvited');
    say('cloud-status', 'teacher.cloud.notInvited');
    return;
  }
  $('btn-cloud-signin').hidden = true;
  $('btn-cloud-signout').hidden = false;
  $('cloud-intro').hidden = true;
  $('cloud-teacher-name').textContent = pageT('teacher.cloud.signedInAs', { name: session.displayName || session.email });
  state.role = role;
  state.host.setRosterReader((code) => fetchRosterByCode(state.sb, code));
  state.host.openCloudOnly();
  $('cloud-classes').hidden = false;
  await loadClasses(storageGet(sessionStorage, RETURN_KEY) || storageGet(localStorage, SELECTED_KEY));
  if (role === 'admin') await loadAdmin();
  await resumeGoogleImport();
}

// ===== Classes =====
async function loadClasses(preferredId = state.selectedId) {
  try {
    state.classes = await listMyClasses(state.sb);
  } catch {
    say('cloud-status', 'teacher.cloud.error');
    return;
  }
  const visible = classesForSwitcher(state.classes, { showArchived: state.showArchived });
  const chosen = pickSelectedClass(visible, preferredId);
  state.selectedId = chosen?.id || null;
  renderSwitcher(visible);
  await showSelectedClass();
}

function renderSwitcher(visible) {
  const select = $('cloud-class-select');
  select.innerHTML = visible.length
    ? visible.map((c) => `<option value="${escapeHTML(c.id)}"${c.id === state.selectedId ? ' selected' : ''}>${escapeHTML(c.name)}${c.archived_at ? escapeHTML(pageT('teacher.cloud.archivedSuffix')) : ''}</option>`).join('')
    : `<option value="">${escapeHTML(pageT('teacher.cloud.noClasses'))}</option>`;
  select.disabled = !visible.length;
}

async function showSelectedClass() {
  const cls = selectedClass();
  $('cloud-class-tools').hidden = !cls;
  storageSet(localStorage, SELECTED_KEY, cls?.id || null);
  if (!cls) {
    state.host.clearReport();
    return;
  }
  $('cloud-class-code').textContent = cls.class_code;
  $('cloud-rename-input').value = cls.name;
  $('cloud-archived-note').hidden = !cls.archived_at;
  $('btn-cloud-archive').textContent = pageT(cls.archived_at ? 'teacher.cloud.reopen' : 'teacher.cloud.archive');
  try {
    const rows = await fetchCloudClassReport(state.sb, cls);
    // The teacher may have switched class while this loaded.
    if (state.selectedId === cls.id) state.host.showCloudClass(cls.class_code, rows);
  } catch {
    say('cloud-status', 'teacher.cloud.error');
  }
}

async function runClassAction(action, doneKey) {
  try {
    await action();
    say('cloud-status', doneKey);
  } catch {
    say('cloud-status', 'teacher.cloud.error');
  }
  await loadClasses();
}

// ===== Roster import =====
async function saveImport(raw) {
  const cls = selectedClass();
  if (!cls) return;
  const normalized = normalizeRosterImport(raw);
  const count = await importRosterToClass(state.sb, cls.id, normalized);
  say('import-status', normalized.skipped.length ? 'teacher.cloud.importedSkipped' : 'teacher.cloud.imported', {
    count: formatNumber(count),
    skipped: formatNumber(normalized.skipped.length),
  });
  await showSelectedClass();
}

async function importFromGoogle() {
  const cls = selectedClass();
  if (!cls) return;
  if (!state.session?.providerToken) {
    // Ask Google for read-only Classroom access, then come back here.
    storageSet(sessionStorage, RETURN_KEY, cls.id);
    say('import-status', 'teacher.cloud.opening');
    try {
      await signInWithGoogle(state.sb, {
        classroom: true,
        redirectTo: teacherRedirectUrl(window.location.href, '?import=google'),
      });
    } catch {
      say('import-status', 'teacher.cloud.error');
    }
    return;
  }
  const adapter = createRosterProvider('google', { accessToken: state.session.providerToken });
  const list = $('google-course-list');
  say('import-status', 'teacher.cloud.loading');
  try {
    const courses = await adapter.listClasses();
    say('import-status', courses.length ? 'teacher.cloud.chooseCourse' : 'teacher.cloud.noCourses');
    list.innerHTML = courses.map((course) => `<button type="button" class="btn" data-course="${escapeHTML(course.externalClassId)}">${escapeHTML(course.name)}</button>`).join('');
  } catch (error) {
    list.replaceChildren();
    say('import-status', errorKey(error));
  }
}

async function importGoogleCourse(courseId) {
  const adapter = createRosterProvider('google', { accessToken: state.session?.providerToken });
  say('import-status', 'teacher.cloud.loading');
  try {
    await saveImport(await adapter.fetchRoster(courseId));
    $('google-course-list').replaceChildren();
  } catch (error) {
    say('import-status', errorKey(error));
  }
}

async function importCSVFile(file) {
  if (!file) return;
  say('import-status', 'teacher.cloud.loading');
  try {
    await saveImport(rosterFromCSV(await file.text()));
  } catch (error) {
    say('import-status', errorKey(error));
  } finally {
    $('import-csv-file').value = '';
  }
}

async function resumeGoogleImport() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('import') !== 'google') return;
  storageSet(sessionStorage, RETURN_KEY, null);
  window.history.replaceState(null, '', teacherRedirectUrl(window.location.href));
  if (!selectedClass()) return;
  $('cloud-import').open = true;
  await importFromGoogle();
}

// ===== School admin =====
async function loadAdmin() {
  $('admin-panel').hidden = false;
  try {
    const raw = await fetchSchoolSummary(state.sb);
    const rows = adminRows(raw);
    const totals = summarizeSchool(raw);
    say('admin-totals', 'admin.totals', {
      classes: formatNumber(totals.classes),
      students: formatNumber(totals.students),
      minutes: formatNumber(totals.weeklyMinutes),
    });
    $('admin-body').innerHTML = rows.length
      ? rows.map((r) => `<tr>
          <td>${escapeHTML(r.className)}${r.archived ? escapeHTML(pageT('teacher.cloud.archivedSuffix')) : ''}</td>
          <td>${escapeHTML(r.teacherName || '—')}</td>
          <td>${escapeHTML(formatNumber(r.students))}</td>
          <td>${escapeHTML(formatNumber(r.activeStudents))}</td>
          <td>${escapeHTML(formatNumber(r.weeklyMinutes))}</td>
        </tr>`).join('')
      : `<tr><td colspan="5">${escapeHTML(pageT('admin.empty'))}</td></tr>`;
  } catch {
    say('admin-status', 'teacher.cloud.error');
  }
}

// ===== Wiring =====
function bind() {
  $('btn-google-signin').addEventListener('click', startGoogleSignIn);
  $('btn-cloud-signin').addEventListener('click', startGoogleSignIn);
  $('btn-cloud-signout').addEventListener('click', async () => {
    try { await signOutTeacher(state.sb); } catch { /* local sign-out only */ }
    resetCloudView();
    $('btn-google-signin').hidden = false;
    // Without the PIN, nothing else on the page may stay open.
    if (!state.host.isPinUnlocked()) state.host.lockPage();
    else state.host.clearReport();
  });
  $('cloud-class-select').addEventListener('change', (event) => {
    state.selectedId = event.target.value || null;
    $('google-course-list').replaceChildren();
    say('import-status');
    showSelectedClass();
  });
  $('cloud-show-archived').addEventListener('change', (event) => {
    state.showArchived = event.target.checked;
    loadClasses();
  });
  $('cloud-new-class-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = $('cloud-new-class-name').value.trim();
    if (!name) return;
    try {
      const created = await createCloudClass(state.sb, name);
      $('cloud-new-class-name').value = '';
      say('cloud-status', 'teacher.cloud.created');
      await loadClasses(created?.id);
    } catch {
      say('cloud-status', 'teacher.cloud.error');
    }
  });
  $('cloud-rename-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const cls = selectedClass();
    const name = $('cloud-rename-input').value.trim();
    if (cls && name) runClassAction(() => renameCloudClass(state.sb, cls.id, name), 'teacher.cloud.renamed');
  });
  $('btn-cloud-archive').addEventListener('click', () => {
    const cls = selectedClass();
    if (!cls) return;
    const archiving = !cls.archived_at;
    if (archiving && !confirm(pageT('teacher.cloud.archiveConfirm'))) return;
    if (archiving && !state.showArchived) state.selectedId = null;
    runClassAction(() => setCloudClassArchived(state.sb, cls.id, archiving),
      archiving ? 'teacher.cloud.archived' : 'teacher.cloud.reopened');
  });
  $('btn-import-google').addEventListener('click', importFromGoogle);
  $('google-course-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-course]');
    if (button) importGoogleCourse(button.dataset.course);
  });
  $('import-csv-file').addEventListener('change', (event) => importCSVFile(event.target.files?.[0]));
  $('admin-invite-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const saved = await inviteTeacher(state.sb, $('admin-invite-email').value, $('admin-invite-role').value);
      say('admin-status', saved ? 'admin.invited' : 'admin.inviteTaken');
      if (saved) $('admin-invite-email').value = '';
    } catch {
      say('admin-status', 'admin.inviteFailed');
    }
  });
}

export async function mountTeacherCloud(host) {
  state.host = host;
  $('cloud-signin').hidden = false;
  $('cloud-panel').hidden = false;
  state.sb = await getTeacherSupabase();
  if (!state.sb) {
    // A pilot build without Supabase settings: say so, offer nothing.
    $('btn-google-signin').disabled = true;
    $('btn-cloud-signin').disabled = true;
    say('cloud-signin-status', 'teacher.cloud.notConfigured');
    say('cloud-status', 'teacher.cloud.notConfigured');
    return;
  }
  bind();
  // Locking the page also signs this device out of the teacher's Google
  // session, so the next person cannot reopen the online classes.
  host.onLock(() => {
    if (!state.session) return;
    resetCloudView();
    signOutTeacher(state.sb).catch(() => {});
  });
  await refreshSession();
}
