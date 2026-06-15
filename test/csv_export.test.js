/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/sync.js', () => ({
  fetchClassRoster: vi.fn(),
  syncProfile: vi.fn(),
  logSession: vi.fn(),
  syncClassRoster: vi.fn(),
}));

import { exportCSV } from '../src/teacher.js';

describe('CSV Export Security', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <table id="student-table">
        <tbody id="student-body">
          <tr>
            <td>=1+2</td>
            <td>Level 1</td>
            <td>100</td>
            <td>500</td>
            <td>10</td>
            <td>Completed</td>
            <td>Local</td>
          </tr>
          <tr>
            <td>Normal Name</td>
            <td>Level 2</td>
            <td>200,300</td>
            <td>"Quoted"</td>
            <td>20</td>
            <td>@Admin</td>
            <td>Cloud</td>
          </tr>
        </tbody>
      </table>
    `;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  it('sanitizes formula triggers and handles commas/quotes', () => {
    // Mock Blob to capture data
    const blobSpy = vi.spyOn(global, 'Blob');

    exportCSV();

    expect(blobSpy).toHaveBeenCalled();
    const csvContent = blobSpy.mock.calls[0][0][0];
    const lines = csvContent.split('\n');

    // Header
    expect(lines[0]).toBe('Name,Level,Words,Score,Stars,Status,Source');

    // Row 1: Name starts with '='
    // Current behavior probably: =1+2,Level 1,100,500,10,Completed,Local
    // Desired behavior: "'=1+2",Level 1,100,500,10,Completed,Local

    // Row 2: Words contains comma, Status starts with '@'
    // Current behavior probably: Normal Name,Level 2,200,300,"Quoted",20,@Admin,Cloud (CORRUPT due to comma)
    // Desired behavior: Normal Name,Level 2,"200,300","""Quoted""",20,"'@Admin",Cloud

    // Check for formula injection fix (prepended ')
    expect(lines[1]).toContain("'=1+2");
    expect(lines[2]).toContain("'@Admin");

    // Check for structural integrity (comma handling)
    // "200,300" should be wrapped in quotes
    expect(lines[2]).toContain('"200,300"');

    // Check for quote escaping
    // '"Quoted"' should become '"""Quoted"""' or similar depending on implementation
    expect(lines[2]).toContain('"""Quoted"""');
  });
});
