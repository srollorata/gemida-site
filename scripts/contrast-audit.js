const fs = require('fs');
console.log('starting contrast audit');

// simple HSL -> RGB converter (w/ standard formula)
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hh >= 0 && hh < 1) {
    r1 = c; g1 = x; b1 = 0;
  } else if (hh >= 1 && hh < 2) {
    r1 = x; g1 = c; b1 = 0;
  } else if (hh >= 2 && hh < 3) {
    r1 = 0; g1 = c; b1 = x;
  } else if (hh >= 3 && hh < 4) {
    r1 = 0; g1 = x; b1 = c;
  } else if (hh >= 4 && hh < 5) {
    r1 = x; g1 = 0; b1 = c;
  } else if (hh >= 5 && hh < 6) {
    r1 = c; g1 = 0; b1 = x;
  }
  const m = l - c/2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

// relative luminance of RGB array [r,g,b]
function luminance(rgb) {
  const [r, g, b] = rgb.map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(rgb1, rgb2) {
  const L1 = luminance(rgb1);
  const L2 = luminance(rgb2);
  const bright = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (bright + 0.05) / (dark + 0.05);
}

const css = fs.readFileSync('app/globals.css', 'utf8');

// We'll parse variables separately for light and dark themes.
const themes = { light: {}, dark: {} };
let darkDepth = 0;

// simple stack-based state for dark class blocks
const lines = css.split(/\r?\n/);
for (const line of lines) {
  if (/\.dark\s*\{/.test(line)) {
    darkDepth = 1;
  } else if (darkDepth > 0) {
    // count braces inside dark block
    for (const char of line) {
      if (char === '{') darkDepth++;
      if (char === '}') darkDepth--;
    }
  }
  const currentTheme = darkDepth > 0 ? 'dark' : 'light';
  const varMatch = line.match(/--([\w-]+):\s*([0-9]+)\s+([0-9]+(?:\.[0-9]+)?)%\s+([0-9]+(?:\.[0-9]+)?)%/);
  if (varMatch) {
    const [, name, h, s, l] = varMatch;
    const rgb = hslToRgb(+h, +s, +l);
    themes[currentTheme][name] = rgb;
    console.log(`${currentTheme} var --${name} -> hsl(${h},${s}%,${l}%) -> rgb(${rgb.join(',')})`);
  }
}

// pairs to check, defaulting to common semantic tokens
const checks = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['border', 'background'],
];

// audit function
function auditTheme(themeName, vars, fallbackBg) {
  console.log(`\n=== ${themeName.toUpperCase()} THEME ===`);
  checks.forEach(([a, b]) => {
    if (!(a in vars) || !(b in vars)) return;
    const ratio = contrastRatio(vars[a], vars[b]).toFixed(2);
    console.log(` - ${a} vs ${b}: ${ratio}:1`);
  });
  const bg = vars.background || fallbackBg;
  if (!bg) return;
  Object.entries(vars).forEach(([name, rgb]) => {
    if (name === 'background' || !rgb) return;
    const ratio = contrastRatio(rgb, bg);
    if (ratio < 4.5) {
      console.log(`⚠ low contrast ${name} vs background: ${ratio.toFixed(2)}:1`);
    }
  });
}

auditTheme('light', themes.light);
auditTheme('dark', themes.dark, themes.light.background);


