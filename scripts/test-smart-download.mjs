// Rigorous test suite for CodePackr Smart Download & Filename Sanitization
import assert from 'node:assert';

// Mirroring the pure logic of smartDownload.ts for node environment test
const ILLEGAL_FILENAME_CHARS = /[/\\?%*:|"<>]/g;
const CONTROL_CHARS = /[\x00-\x1f\x80-\x9f]/g;
const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

function sanitizeFilename(input, expectedExtension = '', fallbackExtension = 'bin') {
  let name = (input || '').trim();
  let warning;

  if (name.includes('/') || name.includes('\\')) {
    name = name.split(/[/\\]/).pop() || '';
  }

  name = name.replace(ILLEGAL_FILENAME_CHARS, '_');
  name = name.replace(CONTROL_CHARS, '');
  name = name.replace(/^\.+/, '');
  name = name.replace(/[\s.]+$/, '');

  const dotIdx = name.lastIndexOf('.');
  let base = dotIdx > 0 ? name.slice(0, dotIdx).trim() : name;
  let ext = dotIdx > 0 ? name.slice(dotIdx + 1).trim().toLowerCase() : '';

  if (WINDOWS_RESERVED_NAMES.test(base)) {
    base = `file_${base}`;
  }

  if (!base) {
    base = 'download';
  }

  if (expectedExtension) {
    const normExpected = expectedExtension.replace(/^\./, '').toLowerCase();
    if (!ext) {
      ext = normExpected;
    } else if (ext !== normExpected) {
      const allowedEq = {
        jpg: ['jpeg'],
        jpeg: ['jpg'],
        htm: ['html'],
        html: ['htm'],
      };
      const isEq = allowedEq[normExpected]?.includes(ext) || allowedEq[ext]?.includes(normExpected);
      if (!isEq) {
        warning = `Filename extension was updated to .${normExpected} to match output format`;
        ext = normExpected;
      }
    }
  } else if (!ext) {
    ext = fallbackExtension.replace(/^\./, '').toLowerCase();
  }

  const MAX_BASE_LEN = 120;
  if (base.length > MAX_BASE_LEN) {
    base = base.slice(0, MAX_BASE_LEN);
  }

  const finalName = ext ? `${base}.${ext}` : base;
  return { sanitizedName: finalName, base, ext, warning };
}

console.log('--- STARTING CODEPACKR SMART DOWNLOAD TEST SUITE ---');

// Test 1: Path Traversal
{
  const res = sanitizeFilename('../../etc/passwd.jpg', 'jpg');
  assert.strictEqual(res.sanitizedName, 'passwd.jpg', 'Path traversal characters must be stripped');
  console.log('  [PASS] Test 1: Path traversal protection passed.');
}

// Test 2: Windows Reserved Device Names
{
  const res = sanitizeFilename('CON.png', 'png');
  assert.strictEqual(res.sanitizedName, 'file_CON.png', 'Windows reserved device name CON must be prefixed');
  const res2 = sanitizeFilename('NUL.json', 'json');
  assert.strictEqual(res2.sanitizedName, 'file_NUL.json', 'Windows reserved device name NUL must be prefixed');
  console.log('  [PASS] Test 2: Windows reserved device names handled safely.');
}

// Test 3: Illegal Characters Replacement
{
  const res = sanitizeFilename('my<super>:cool*file?name|.jpg', 'jpg');
  assert.strictEqual(res.sanitizedName, 'my_super__cool_file_name_.jpg', 'Illegal characters must be replaced with underscores');
  console.log('  [PASS] Test 3: Illegal filesystem characters sanitized.');
}

// Test 4: Extension Enforcement
{
  const res = sanitizeFilename('report.pdf', 'json');
  assert.strictEqual(res.sanitizedName, 'report.json', 'Extension must be updated to match target JSON format');
  assert.ok(res.warning, 'Warning should be returned for mismatched extension');
  console.log('  [PASS] Test 4: Target format extension strictly enforced.');
}

// Test 5: JPEG / JPG Equivalence
{
  const res = sanitizeFilename('passport_photo.jpeg', 'jpg');
  assert.strictEqual(res.sanitizedName, 'passport_photo.jpeg', 'JPEG and JPG are equivalent extensions');
  assert.strictEqual(res.warning, undefined, 'No warning should be triggered for JPEG/JPG equivalence');
  console.log('  [PASS] Test 5: Equivalent extensions handled without false warnings.');
}

// Test 6: Empty / Whitespace-only input
{
  const res = sanitizeFilename('   ', 'edi');
  assert.strictEqual(res.sanitizedName, 'download.edi', 'Empty filename should fall back to safe default');
  console.log('  [PASS] Test 6: Empty input correctly defaults.');
}

// Test 7: Dimension Unit Conversion (cm, mm, inch <-> px @ 300 DPI)
{
  function unitToPixels(val, unit, currentDpi) {
    if (!val || val <= 0) return 1;
    if (unit === 'px') return Math.max(1, Math.round(val));
    if (unit === 'inch') return Math.max(1, Math.round(val * currentDpi));
    if (unit === 'cm') return Math.max(1, Math.round((val / 2.54) * currentDpi));
    if (unit === 'mm') return Math.max(1, Math.round((val / 25.4) * currentDpi));
    return Math.max(1, Math.round(val));
  }

  function pixelsToUnit(px, targetUnit, currentDpi) {
    if (!px || px <= 0) return 1;
    if (targetUnit === 'px') return Math.max(1, Math.round(px));
    if (targetUnit === 'inch') return Math.max(0.01, Math.round((px / currentDpi) * 100) / 100);
    if (targetUnit === 'cm') return Math.max(0.01, Math.round(((px * 2.54) / currentDpi) * 100) / 100);
    if (targetUnit === 'mm') return Math.max(0.1, Math.round(((px * 25.4) / currentDpi) * 10) / 10);
    return Math.max(1, Math.round(px));
  }

  // 2x2 inch passport photo @ 300 DPI -> 600x600 px
  assert.strictEqual(unitToPixels(2, 'inch', 300), 600);
  assert.strictEqual(pixelsToUnit(600, 'inch', 300), 2);

  // 3.5 x 4.5 cm Indian / Schengen passport photo @ 300 DPI -> 413 x 531 px
  assert.strictEqual(unitToPixels(3.5, 'cm', 300), 413);
  assert.strictEqual(unitToPixels(4.5, 'cm', 300), 531);
  assert.strictEqual(pixelsToUnit(413, 'cm', 300), 3.5);
  assert.strictEqual(pixelsToUnit(531, 'cm', 300), 4.5);

  // 35 x 45 mm @ 300 DPI -> 413 x 531 px
  assert.strictEqual(unitToPixels(35, 'mm', 300), 413);
  assert.strictEqual(unitToPixels(45, 'mm', 300), 531);
  assert.strictEqual(pixelsToUnit(413, 'mm', 300), 35);
  assert.strictEqual(pixelsToUnit(531, 'mm', 300), 45);

  console.log('  [PASS] Test 7: cm, mm, inch <-> px conversion matches international passport standards.');
}

console.log('====================================================');
console.log('ALL 6 SMART DOWNLOAD SANITIZATION TESTS PASSED 100%!');
console.log('====================================================');
