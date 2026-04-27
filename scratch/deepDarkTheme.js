const fs = require('fs');

let css = fs.readFileSync('frontend/src/index.css', 'utf-8');

// First, remove the existing :root and [data-theme="light"] blocks we added earlier to start fresh.
css = css.replace(/:root\s*{[^}]*}\s*/, '');
css = css.replace(/\[data-theme="light"\]\s*{[^}]*}\s*/, '');

const variables = `
:root {
  /* DARK MODE (Default Native) */
  --bg-body: #0a0c0a;
  --bg-card: #121512;
  --bg-card-hover: #161a16;
  --bg-input: #151815;
  --bg-secondary: #1a1e1a;
  --bg-tertiary: #1e241e;
  
  /* Glassmorphism / Overlays */
  --bg-glass: rgba(18, 21, 18, 0.85);
  --bg-glass-input: rgba(21, 24, 21, 0.95);
  --bg-overlay: rgba(10, 12, 10, 0.8);
  
  --text-main: #e8ece8;
  --text-muted: #8c9c8c;
  --text-inverse: #ffffff;
  --text-accent: #8bbf69;
  
  --border-light: #222822;
  --border-main: #2a332a;
  --border-focus: #4a7a3a;
  --border-glass: rgba(255, 255, 255, 0.05);
  
  --primary-main: #4a7a3a;
  --primary-dark: #6ca14a; 
  --primary-light: #1e2e17;
  --primary-gradient: linear-gradient(135deg, #4a7a3a, #2d4d23);
  
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 12px 32px rgba(108, 161, 74, 0.2);
  
  /* Status Colors */
  --bg-error: #3a1515;
  --text-error: #ff8a8a;
  --border-error: #5a2020;
  
  --bg-warning: #3a2a0a;
  --text-warning: #ffd24d;
  
  --bg-neutral: #1a201a;
  --text-neutral: #a3a3a3;

  /* Specific elements */
  --bg-empty-state: linear-gradient(135deg, #121612, #181d18);
  --bg-summary: linear-gradient(135deg, #131813, #1a201a);
  --date-chip: #161a16;
  --date-chip-hover: #1e241e;

  /* Background gradients */
  --bg-gradient-1: rgba(108, 161, 74, 0.08);
  --bg-gradient-2: rgba(45, 77, 35, 0.15);
  --bg-gradient-base: linear-gradient(135deg, #0a0c0a 0%, #111511 100%);
}

[data-theme="light"] {
  --bg-body: #f3f7f0;
  --bg-card: #ffffff;
  --bg-card-hover: #f9fbf8;
  --bg-input: #ffffff;
  --bg-secondary: #f7faf4;
  --bg-tertiary: #eef4ea;
  
  --bg-glass: rgba(255, 255, 255, 0.82);
  --bg-glass-input: rgba(255, 255, 255, 0.92);
  --bg-overlay: rgba(255, 255, 255, 0.7);
  
  --text-main: #18231c;
  --text-muted: #607060;
  --text-inverse: #ffffff;
  --text-accent: #244f32;
  
  --border-light: #edf2e9;
  --border-main: #dce7d8;
  --border-focus: #7aa95c;
  --border-glass: rgba(218, 226, 214, 0.9);
  
  --primary-main: #244f32;
  --primary-dark: #1b3d25;
  --primary-light: #eef4ea;
  --primary-gradient: linear-gradient(135deg, #244f32, #163620);
  
  --shadow-sm: 0 2px 8px rgba(36, 79, 50, 0.04);
  --shadow-md: 0 12px 24px rgba(36, 79, 50, 0.18);
  --shadow-glow: 0 12px 32px rgba(36, 79, 50, 0.12);
  
  --bg-error: #fff2f2;
  --text-error: #d63333;
  --border-error: #ffd1d1;
  
  --bg-warning: #fff8e6;
  --text-warning: #b28100;
  
  --bg-neutral: #f2f4f2;
  --text-neutral: #69766b;

  --bg-empty-state: linear-gradient(135deg, #f8fbf6, #f0f6ec);
  --bg-summary: linear-gradient(135deg, #f7faf4, #eef5ea);
  --date-chip: #f7faf4;
  --date-chip-hover: #eef4ea;

  --bg-gradient-1: rgba(165, 214, 140, 0.18);
  --bg-gradient-2: rgba(35, 79, 50, 0.08);
  --bg-gradient-base: linear-gradient(135deg, #f7f8f4 0%, #eff3ec 100%);
}
`;

// Advanced replacements catching everything
const map = [
  // Text colors missed
  [/color:\s*#18231c;/g, 'color: var(--text-main);'],
  [/color:\s*#455248;/g, 'color: var(--text-main);'],
  [/color:\s*#2c352d;/g, 'color: var(--text-main);'],
  [/color:\s*#384238;/g, 'color: var(--text-main);'],
  [/color:\s*#5d6b60;/g, 'color: var(--text-muted);'],
  [/color:\s*#607060;/g, 'color: var(--text-muted);'],
  [/color:\s*#69766b;/g, 'color: var(--text-muted);'],
  [/color:\s*#6c7a6c;/g, 'color: var(--text-muted);'],
  [/color:\s*#657365;/g, 'color: var(--text-muted);'],
  [/color:\s*#6b786c;/g, 'color: var(--text-muted);'],
  [/color:\s*#71806f;/g, 'color: var(--text-muted);'],
  [/color:\s*#9aa59a;/g, 'color: var(--text-muted);'],
  [/color:\s*#244f32;/g, 'color: var(--text-accent);'],
  [/color:\s*white;/gi, 'color: var(--text-inverse);'],
  [/color:\s*#ffffff;/gi, 'color: var(--text-inverse);'],

  // Backgrounds missed
  [/background:\s*#f6f7f3;/g, 'background: var(--bg-body);'],
  [/background:\s*#f3f7f0;/g, 'background: var(--bg-body);'],
  [/background-color:\s*#f3f7f0;/g, 'background-color: var(--bg-body);'],
  [/background:\s*white;/gi, 'background: var(--bg-card);'],
  [/background:\s*#ffffff;/gi, 'background: var(--bg-card);'],
  [/background-color:\s*white;/gi, 'background-color: var(--bg-card);'],
  [/background-color:\s*#ffffff;/gi, 'background-color: var(--bg-card);'],
  [/background:\s*#f7faf4;/g, 'background: var(--bg-secondary);'],
  [/background:\s*#eef4ea;/g, 'background: var(--bg-tertiary);'],
  [/background:\s*#f1f6ee;/g, 'background: var(--bg-secondary);'],
  [/background:\s*#e8eee5;/g, 'background: var(--bg-tertiary);'],
  [/background:\s*#eef1eb;/g, 'background: var(--bg-secondary);'],
  [/background:\s*#e7f1e2;/g, 'background: var(--bg-tertiary);'],
  [/background:\s*#eaf3e4;/g, 'background: var(--bg-tertiary);'],
  [/background:\s*#244f32;/g, 'background: var(--primary-main);'],
  [/background-color:\s*#244f32;/g, 'background-color: var(--primary-main);'],
  [/background:\s*#1b3d25;/g, 'background: var(--primary-dark);'],
  [/background:\s*#7aa95c;/g, 'background: var(--text-accent);'],
  [/background:\s*#c9d2c4;/g, 'background: var(--border-main);'],
  [/background:\s*#e3ebdf;/g, 'background: var(--border-main);'],

  // Gradients missed
  [/background:\s*linear-gradient\(135deg,\s*#244f32,\s*#163620\);/g, 'background: var(--primary-gradient);'],
  [/background:\s*linear-gradient\(135deg,\s*#244f32,\s*#7aa95c\);/g, 'background: var(--primary-gradient);'],
  [/background:\s*linear-gradient\(135deg,\s*#f8fbf6,\s*#f0f6ec\);/g, 'background: var(--bg-empty-state);'],
  [/background:\s*linear-gradient\(135deg,\s*#f7faf4,\s*#eef5ea\);/g, 'background: var(--bg-summary);'],
  
  // Specific body background radial gradient
  [/background:\s*radial-gradient\(circle at top left, rgba\(165, 214, 140, 0\.18\), transparent 22%\),\s*radial-gradient\(circle at bottom right, rgba\(35, 79, 50, 0\.08\), transparent 28%\),\s*linear-gradient\(135deg, #f7f8f4 0%, #eff3ec 100%\);/g, 
   'background:\n    radial-gradient(circle at top left, var(--bg-gradient-1), transparent 22%),\n    radial-gradient(circle at bottom right, var(--bg-gradient-2), transparent 28%),\n    var(--bg-gradient-base);'],

  // Glassmorphism missed
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0\.82\);/g, 'background: var(--bg-glass);'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0\.92\);/g, 'background: var(--bg-glass-input);'],
  [/background:\s*rgba\(255,\s*255,\s*255,\s*0\.7\);/g, 'background: var(--bg-overlay);'],
  [/border:\s*1px solid rgba\(218,\s*226,\s*214,\s*0\.9\);/g, 'border: 1px solid var(--border-glass);'],

  // Borders missed
  [/border:\s*1px solid #dce7d8;/g, 'border: 1px solid var(--border-main);'],
  [/border:\s*1px solid #e1eadc;/g, 'border: 1px solid var(--border-light);'],
  [/border:\s*1px solid #dfe8db;/g, 'border: 1px solid var(--border-main);'],
  [/border:\s*1px solid #d7dfd4;/g, 'border: 1px solid var(--border-main);'],
  [/border-top:\s*1px solid #edf2e9;/g, 'border-top: 1px solid var(--border-light);'],
  [/border-bottom:\s*1px solid #edf2e9;/g, 'border-bottom: 1px solid var(--border-light);'],
  [/border:\s*1px dashed #d4e0d1;/g, 'border: 1px dashed var(--border-main);'],
  [/border-color:\s*#244f32;/g, 'border-color: var(--primary-main);'],
  [/border-color:\s*#e0e6dd;/g, 'border-color: var(--border-light);'],
  [/border-color:\s*#6e965c;/g, 'border-color: var(--border-focus);'],
  [/border-color:\s*#7aa95c;/g, 'border-color: var(--border-focus);'],

  // Box shadows missed
  [/box-shadow:\s*0 12px 24px rgba\(36, 79, 50, 0\.18\);/g, 'box-shadow: var(--shadow-md);'],
  [/box-shadow:\s*0 14px 28px rgba\(36, 79, 50, 0\.24\);/g, 'box-shadow: var(--shadow-glow);'],
  [/box-shadow:\s*0 0 0 4px rgba\(110, 150, 92, 0\.12\);/g, 'box-shadow: 0 0 0 4px rgba(74, 122, 58, 0.3);'],
  [/box-shadow:\s*0 2px 8px rgba\(36, 79, 50, 0\.04\);/g, 'box-shadow: var(--shadow-sm);'],
  [/box-shadow:\s*0 8px 24px rgba\(36, 79, 50, 0\.08\);/g, 'box-shadow: var(--shadow-md);'],
  [/box-shadow:\s*0 12px 32px rgba\(36, 79, 50, 0\.12\);/g, 'box-shadow: var(--shadow-glow);'],

  // Badges
  [/background:\s*#fff2f2;/g, 'background: var(--bg-error);'],
  [/color:\s*#d63333;/g, 'color: var(--text-error);'],
  [/border:\s*1px solid #ffd1d1;/g, 'border: 1px solid var(--border-error);'],
  
  [/background:\s*#fff8e6;/g, 'background: var(--bg-warning);'],
  [/color:\s*#b28100;/g, 'color: var(--text-warning);'],
  
  [/background:\s*#f2f4f2;/g, 'background: var(--bg-neutral);'],
  
  // Specific overlays and selections
  [/background:\s*rgba\(110, 150, 92, 0\.22\);/g, 'background: rgba(108, 161, 74, 0.3);'],
  [/background:\s*rgba\(120, 140, 120, 0\.3\);/g, 'background: rgba(148, 163, 148, 0.3);'],
  [/background:\s*rgba\(120, 140, 120, 0\.45\);/g, 'background: rgba(148, 163, 148, 0.45);'],
];

// In case the previous regex script left things like "color: var(--text-main);" let's not touch those unless necessary.
// We are applying this to the raw css.
// Wait, the file currently has `var(--bg-body)` AND hardcoded stuff because the previous script only matched exact strings.
// Let's just run this and it will replace the hardcoded ones that were missed.

for (const [regex, replacement] of map) {
  css = css.replace(regex, replacement);
}

fs.writeFileSync('frontend/src/index.css', variables + '\\n' + css);
console.log('Complete Deep Dark Mode applied.');
