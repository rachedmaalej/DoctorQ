/**
 * Transplant the mobile hero from blesaf-hero.html into Design C
 * of landing-page-alternatives.html.
 *
 * Fixes applied vs v1:
 *  - phone2 & phone3 removed (display:none on mobile AND they have broken
 *    div balance in blesaf-hero.html that breaks the phone-frame container)
 *  - nav position changed from fixed → sticky so it stays inside phone frame
 *  - JS patched to null-check phone2/phone3 (they no longer exist in DOM)
 */
const fs   = require('fs');
const path = require('path');

const SRC  = path.resolve(__dirname, 'blesaf-hero.html');
const DEST = path.resolve(__dirname, 'mockups/landing-page-alternatives.html');
const SCOPE = '#design-c .phone-screen';

// ── 1. Read source ───────────────────────────────────────────────────────────
const src = fs.readFileSync(SRC, 'utf8');
console.log(`Read source (${Math.round(src.length/1024)} KB)`);

// ── 2. Extract CSS ───────────────────────────────────────────────────────────
const cssMatch = src.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) { console.error('ERROR: no <style>'); process.exit(1); }
const rawCss = cssMatch[1];
console.log(`Extracted CSS (${Math.round(rawCss.length/1024)} KB)`);

// ── 3. Extract hero HTML (nav + section) ────────────────────────────────────
const heroMatch = src.match(/(<!-- NAV -->[\s\S]*?<\/section>)/);
if (!heroMatch) { console.error('ERROR: no hero section'); process.exit(1); }
let heroHtml = heroMatch[1];
console.log(`Extracted hero HTML (${Math.round(heroHtml.length/1024)} KB)`);

// ── 4. Strip phone2 and phone3 from hero HTML ────────────────────────────────
// Phone2 and phone3 are display:none on mobile, AND they have broken div
// balance in the source file which breaks the phone-frame container when
// transplanted into a nested div context.
function stripPhone(html, id) {
  // Match from the comment or the div start to the next phone comment or end of mockup-wrap
  // Pattern: <!-- Phone N: ... --> ... <div class="phone-mockup" id="phoneN"> ... </div>
  // We look for the whole phone-mockup div block
  const startComment = html.indexOf(`<!-- Phone ${id.replace('phone', '')}:`);
  if (startComment === -1) {
    // Try without comment
    const divStart = html.indexOf(`id="${id}"`);
    if (divStart === -1) { console.log(`${id} not found, skipping`); return html; }
    // Find the opening <div
    const openDiv = html.lastIndexOf('<div', divStart);
    // Find the matching closing div
    let depth = 1, i = html.indexOf('>', divStart) + 1;
    while (i < html.length && depth > 0) {
      if (html.slice(i,i+4) === '<div') depth++;
      else if (html.slice(i,i+6) === '</div>') { depth--; if (depth === 0) { i += 6; break; } }
      i++;
    }
    return html.slice(0, openDiv) + html.slice(i);
  }
  // Find the phone-mockup div after the comment
  const divAfter = html.indexOf(`<div class="phone-mockup" id="${id}">`, startComment);
  // Find closing </div>
  let depth = 1;
  let i = html.indexOf('>', divAfter) + 1;
  while (i < html.length && depth > 0) {
    if (html.slice(i, i+4) === '<div') depth++;
    else if (html.slice(i, i+6) === '</div>') { depth--; if (depth === 0) { i += 6; break; } }
    i++;
  }
  return html.slice(0, startComment) + html.slice(i);
}

heroHtml = stripPhone(heroHtml, 'phone2');
heroHtml = stripPhone(heroHtml, 'phone3');
console.log(`After removing phone2+phone3: (${Math.round(heroHtml.length/1024)} KB)`);

// ── 4b. Repair orphan </div> tags ───────────────────────────────────────────
// Walk the HTML, tracking div depth. Any </div> when depth=0 is an orphan
// caused by malformed HTML in the source; strip them so they don't close
// ancestor divs in the nested target context.
function repairDivBalance(html) {
  const out = [];
  let i = 0, depth = 0, skipped = 0;
  while (i < html.length) {
    if (html.slice(i, i+4) === '<div') {
      const end = html.indexOf('>', i);
      out.push(html.slice(i, end + 1));
      depth++;
      i = end + 1;
    } else if (html.slice(i, i+6) === '</div>') {
      if (depth > 0) { out.push('</div>'); depth--; }
      else { skipped++; }
      i += 6;
    } else {
      out.push(html[i++]);
    }
  }
  if (skipped) console.log(`Removed ${skipped} orphan </div> tag(s)`);
  return out.join('');
}
heroHtml = repairDivBalance(heroHtml);

// Verify div balance
const heroClean = heroHtml.replace(/src="data:image\/[^"]+"/g, '');
const heroOpens = (heroClean.match(/<div[^>]*>/g) || []).length;
const heroCloses = (heroClean.match(/<\/div>/g) || []).length;
console.log(`Hero div balance: +${heroOpens} -${heroCloses} = ${heroOpens - heroCloses}`);
if (heroOpens !== heroCloses) {
  console.warn(`WARNING: hero div balance is ${heroOpens - heroCloses}, not 0!`);
}

// ── 5. Extract JS ────────────────────────────────────────────────────────────
const jsMatch = src.match(/<script>([\s\S]*?)<\/script>/);
if (!jsMatch) { console.error('ERROR: no <script>'); process.exit(1); }
let rawJs = jsMatch[1];

// Patch JS: null-check phone2/phone3 since they're removed from DOM
rawJs = rawJs.replace(
  /const phone2\s*=\s*document\.getElementById\('phone2'\);/,
  "const phone2 = document.getElementById('phone2'); // removed from DOM - null"
);
rawJs = rawJs.replace(
  /const phone3\s*=\s*document\.getElementById\('phone3'\);/g,
  "const phone3 = document.getElementById('phone3'); // removed from DOM - null"
);
// Wrap phone2/phone3 operations in null checks
rawJs = rawJs.replace(
  /setTimeout\(\(\) => phone2\.classList\.add\('visible'\), \d+\);/g, ''
);
rawJs = rawJs.replace(
  /setTimeout\(\(\) => phone3\.classList\.add\('visible'\), \d+\);/g, ''
);
rawJs = rawJs.replace(/phone2\.classList\.remove\('visible'\);/g, "if(phone2) phone2.classList.remove('visible');");
rawJs = rawJs.replace(/phone3\.classList\.remove\('visible'\);/g, "if(phone3) phone3.classList.remove('visible');");

// ── 6. Process CSS ───────────────────────────────────────────────────────────
const kfRe = /@keyframes\s+[\w-]+\s*\{(?:[^{}]*(?:\{[^{}]*\})*[^{}]*)*\}/g;
const keyframeBlocks = [];
rawCss.replace(kfRe, m => { keyframeBlocks.push(m); return ''; });
const cssNoKf = rawCss.replace(kfRe, '');

const mediaRe = /@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\}\s*\/\*\s*end @media mobile\s*\*\//;
const mediaMatch = cssNoKf.match(mediaRe);
const mobileCssInner = mediaMatch ? mediaMatch[1] : '';
const cssBase = mediaMatch ? cssNoKf.replace(mediaRe, '') : cssNoKf;

function scopeCSS(cssText, prefix) {
  const out = [];
  let i = 0;
  const n = cssText.length;
  while (i < n) {
    if (' \t\n\r'.includes(cssText[i])) { out.push(cssText[i++]); continue; }
    if (cssText.slice(i, i+2) === '/*') {
      const end = cssText.indexOf('*/', i+2);
      if (end === -1) { out.push(cssText.slice(i)); break; }
      out.push(cssText.slice(i, end+2)); i = end+2; continue;
    }
    if (cssText[i] === '@') {
      let j = i+1, depth = 0, found = false;
      while (j < n) {
        if (cssText[j] === '{') depth++;
        else if (cssText[j] === '}') { depth--; if (depth === 0) { j++; found = true; break; } }
        else if (cssText[j] === ';' && depth === 0) { j++; found = true; break; }
        j++;
      }
      out.push(cssText.slice(i, j)); i = j; continue;
    }
    const braceOpen = cssText.indexOf('{', i);
    if (braceOpen === -1) { out.push(cssText.slice(i)); break; }
    const nextClose = cssText.indexOf('}', i);
    if (nextClose !== -1 && nextClose < braceOpen) {
      out.push(cssText.slice(i, nextClose+1)); i = nextClose+1; continue;
    }
    const selectorRaw = cssText.slice(i, braceOpen);
    if (!selectorRaw.trim()) { out.push(cssText[braceOpen]); i = braceOpen+1; continue; }
    let depth = 1, j = braceOpen+1;
    while (j < n && depth > 0) {
      if (cssText[j] === '{') depth++;
      else if (cssText[j] === '}') depth--;
      j++;
    }
    const declarations = cssText.slice(braceOpen, j);
    const scoped = selectorRaw.split(',').map(s => {
      s = s.trim();
      if (!s) return '';
      if (s === ':root') return prefix;
      return `${prefix} ${s}`;
    }).filter(Boolean).join(',\n');
    out.push(scoped + ' ' + declarations);
    i = j;
  }
  return out.join('');
}

const scopedMain   = scopeCSS(cssBase, SCOPE);
const scopedMobile = scopeCSS(mobileCssInner, SCOPE);

// ── 7. Build final CSS block ─────────────────────────────────────────────────
const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');\n`;

const scopeVarBlock = `${SCOPE} {
  --teal: #0EA884; --teal-dark: #0C967A; --ink: #0D1F1A;
  --text-mid: #3D5A54; --page-bg: #F5F9F8; --border: #DFF0EB; --gold: #F5A623;
  font-family: 'DM Sans', sans-serif;
}\n`;

// Critical fix: override position:fixed nav → sticky inside phone frame
const navFix = `${SCOPE} nav {
  position: sticky !important;
  top: 0 !important;
  left: unset !important;
  right: unset !important;
  width: 100% !important;
  z-index: 50 !important;
}\n`;

const finalCss = [
  '',
  '    /* ══════════════════════════════════════════════════════',
  '       BléSaf Hero — transplanted from blesaf-hero.html',
  '       phone2 & phone3 removed (display:none on mobile)',
  '       ════════════════════════════════════════════════════ */',
  `    ${fontImport}`,
  `    ${scopeVarBlock}`,
  ...keyframeBlocks,
  '',
  scopedMain,
  '    /* ── Mobile layout (always active in 375px phone frame) ── */',
  scopedMobile,
  '    /* ── Critical fix: nav must be sticky not fixed ── */',
  navFix,
  '    /* ═══════════════════════════════════════════════════════ */',
  '',
].join('\n');

console.log(`Built scoped CSS (${Math.round(finalCss.length/1024)} KB)`);

// ── 8. Adapt hero HTML ────────────────────────────────────────────────────────
let adaptedHero = heroHtml
  .replace(/<p class="mobile-sub" style="display:none;">/g, '<p class="mobile-sub">')
  .replace(/<div class="mobile-cta" style="display:none;">/g, '<div class="mobile-cta">')
  .replace(/<div class="mobile-proof" style="display:none;">/g, '<div class="mobile-proof">');

adaptedHero = `
        <!-- ╔══ BléSaf Hero (transplanted from blesaf-hero.html) ══╗ -->
${adaptedHero}
        <!-- ╚══ BléSaf Hero end ════════════════════════════════════╝ -->
`;

console.log(`Adapted hero HTML (${Math.round(adaptedHero.length/1024)} KB)`);

// ── 9. Read target ────────────────────────────────────────────────────────────
let target = fs.readFileSync(DEST, 'utf8');
console.log(`Read target (${Math.round(target.length/1024)} KB)`);

// ── 10. Insert scoped CSS before </style> ─────────────────────────────────────
if (!target.includes('</style>')) { console.error('ERROR: no </style>'); process.exit(1); }
target = target.replace('</style>', finalCss + '\n  </style>');

// ── 11. Replace Design C nav + dc-hero ───────────────────────────────────────
const NAV_MARKER    = '        <!-- Nav -->';
const VALS_MARKER   = '        <!-- Value Props -->';
const DESIGN_C_ANCHOR = 'id="design-c"';

const designCIdx = target.indexOf(DESIGN_C_ANCHOR);
if (designCIdx === -1) { console.error('ERROR: DESIGN_C_ANCHOR not found'); process.exit(1); }
const navIdx  = target.indexOf(NAV_MARKER, designCIdx);
const valsIdx = target.indexOf(VALS_MARKER, navIdx > -1 ? navIdx : designCIdx);
if (navIdx === -1)  { console.error('ERROR: NAV_MARKER not found after design-c'); process.exit(1); }
if (valsIdx === -1) { console.error('ERROR: VALS_MARKER not found after design-c'); process.exit(1); }
console.log(`Replacing from pos ${navIdx} to ${valsIdx}`);

const replacement = adaptedHero + '\n        <script>' + rawJs + '\n        </script>\n\n';
target = target.slice(0, navIdx) + replacement + target.slice(valsIdx);

console.log(`Final file size: ${Math.round(target.length/1024)} KB`);

// ── 12. Write ─────────────────────────────────────────────────────────────────
fs.writeFileSync(DEST, target, 'utf8');
console.log('Done!');
