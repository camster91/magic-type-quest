import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readCloudDrillConfig } from '../scripts/verify-cloud-boundary.mjs';

const validEnv = {
  BLOOMTYPE_QA_SUPABASE_URL: 'https://qa-project.supabase.co',
  BLOOMTYPE_QA_SUPABASE_ANON_KEY: 'anon-key',
  BLOOMTYPE_QA_STUDENT_A_EMAIL: 'student-a@example.test',
  BLOOMTYPE_QA_STUDENT_A_PASSWORD: 'secret-a',
  BLOOMTYPE_QA_STUDENT_B_EMAIL: 'student-b@example.test',
  BLOOMTYPE_QA_STUDENT_B_PASSWORD: 'secret-b',
  BLOOMTYPE_QA_TEACHER_EMAIL: 'teacher@example.test',
  BLOOMTYPE_QA_TEACHER_PASSWORD: 'secret-teacher',
  BLOOMTYPE_QA_TEACHER_CLASS_CODE: 'classa',
  BLOOMTYPE_QA_OTHER_CLASS_CODE: 'classb',
  BLOOMTYPE_CLOUD_DRILL_CONFIRM: 'DELETE_QA_DATA',
};

describe('authenticated cloud boundary drill', () => {
  it('fails closed before network access when configuration or destructive acknowledgement is absent', () => {
    expect(() => readCloudDrillConfig({})).toThrow('Missing cloud drill configuration');
    expect(() => readCloudDrillConfig({ ...validEnv, BLOOMTYPE_CLOUD_DRILL_CONFIRM: '' }))
      .toThrow('DELETE_QA_DATA');
  });

  it('normalizes non-secret inputs without returning credentials in diagnostics', () => {
    const config = readCloudDrillConfig(validEnv);
    expect(config.url).toBe('https://qa-project.supabase.co');
    expect(config.teacherClassCode).toBe('CLASSA');
    expect(config.otherClassCode).toBe('CLASSB');
    expect(JSON.stringify({
      url: config.url,
      teacherClassCode: config.teacherClassCode,
      otherClassCode: config.otherClassCode,
    })).not.toContain('secret-');
  });

  it('requires distinct class boundaries and never logs credential values', () => {
    expect(() => readCloudDrillConfig({ ...validEnv, BLOOMTYPE_QA_OTHER_CLASS_CODE: 'classa' }))
      .toThrow('must differ');
    const source = readFileSync(resolve('scripts/verify-cloud-boundary.mjs'), 'utf8');
    expect(source).not.toMatch(/console\.(?:log|error)\([^\n]*(?:password|anonKey|email)/u);
    expect(source).toContain("BLOOMTYPE_CLOUD_DRILL_CONFIRM !== CONFIRMATION");
    const gitignore = readFileSync(resolve('.gitignore'), 'utf8');
    expect(gitignore).toContain('.env.*');
  });
});
