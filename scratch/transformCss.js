const fs = require('fs');

let css = fs.readFileSync('frontend/src/index.css', 'utf-8');

const variables = `
:root {
  /* DARK MODE (Default) */
  --bg-body: #0a0d0a;
  --bg-card: #131813;
  --bg-card-hover: #1a201a;
  --bg-input: #1a201a;
  --bg-secondary: #1a201a;
  --bg-tertiary: #202820;
  --bg-overlay: rgba(20, 25, 20, 0.7);
  
  --text-main: #e2e8e2;
  --text-muted: #94a394;
  --text-inverse: #ffffff;
  
  --border-light: #242d24;
  --border-main: #2a352a;
  --border-focus: #456635;
  
  --primary-main: #6ca14a; /* Lighter green for dark mode visibility */
  --primary-dark: #81ba5d;
  --primary-light: #243518;
  --primary-gradient: linear-gradient(135deg, #243518, #3b5a27);
  
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.4);
  --shadow-md: 0 8px 24px rgba(0,0,0,0.5);
  --shadow-glow: 0 12px 32px rgba(108, 161, 74, 0.15);
  
  /* Status Colors */
  --bg-error: #3a1515;
  --text-error: #ff8a8a;
  --border-error: #5a2020;
  
  --bg-warning: #3a2a0a;
  --text-warning: #ffd24d;
  
  --bg-neutral: #1a201a;
  --text-neutral: #a3a3a3;

  /* Specific elements */
  --bg-empty-state: linear-gradient(135deg, #161c16, #1a201a);
  --bg-summary: linear-gradient(135deg, #131813, #1a201a);
  --date-chip: #1a201a;
  --date-chip-hover: #202820;
}

[data-theme="light"] {
  --bg-body: #f3f7f0;
  --bg-card: #ffffff;
  --bg-card-hover: #f9fbf8;
  --bg-input: #f7faf4;
  --bg-secondary: #f7faf4;
  --bg-tertiary: #eef4ea;
  --bg-overlay: rgba(255, 255, 255, 0.7);
  
  --text-main: #2c352d;
  --text-muted: #607060;
  --text-inverse: #ffffff;
  
  --border-light: #edf2e9;
  --border-main: #dce7d8;
  --border-focus: #7aa95c;
  
  --primary-main: #244f32;
  --primary-dark: #1b3d25;
  --primary-light: #eef4ea;
  --primary-gradient: linear-gradient(135deg, #244f32, #7aa95c);
  
  --shadow-sm: 0 2px 8px rgba(36, 79, 50, 0.04);
  --shadow-md: 0 8px 24px rgba(36, 79, 50, 0.08);
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
}

`;

// Replacements
const map = [
  // Backgrounds
  [/background-color: #f3f7f0;/g, 'background-color: var(--bg-body);'],
  [/background: #f3f7f0;/g, 'background: var(--bg-body);'],
  [/background: white;/gi, 'background: var(--bg-card);'],
  [/background: #ffffff;/gi, 'background: var(--bg-card);'],
  [/background-color: white;/gi, 'background-color: var(--bg-card);'],
  [/background-color: #ffffff;/gi, 'background-color: var(--bg-card);'],
  [/background: #f7faf4;/g, 'background: var(--bg-secondary);'],
  [/background: #eef4ea;/g, 'background: var(--bg-tertiary);'],
  [/background: #f1f6ee;/g, 'background: var(--bg-secondary);'],
  [/background: #e8eee5;/g, 'background: var(--bg-tertiary);'],
  [/background: #eef1eb;/g, 'background: var(--bg-secondary);'],
  [/background: #e7f1e2;/g, 'background: var(--bg-tertiary);'],
  [/background: #eaf3e4;/g, 'background: var(--bg-tertiary);'],
  [/background: rgba\(255, 255, 255, 0.7\);/g, 'background: var(--bg-overlay);'],
  [/background: #244f32;/g, 'background: var(--primary-main);'],
  [/background-color: #244f32;/g, 'background-color: var(--primary-main);'],
  [/background: #1b3d25;/g, 'background: var(--primary-dark);'],
  [/background: linear-gradient\(135deg, #244f32, #7aa95c\);/g, 'background: var(--primary-gradient);'],
  [/background: linear-gradient\(135deg, #f8fbf6, #f0f6ec\);/g, 'background: var(--bg-empty-state);'],
  [/background: linear-gradient\(135deg, #f7faf4, #eef5ea\);/g, 'background: var(--bg-summary);'],

  // Text colors
  [/color: #2c352d;/g, 'color: var(--text-main);'],
  [/color: #455248;/g, 'color: var(--text-main);'],
  [/color: #384238;/g, 'color: var(--text-main);'],
  [/color: #607060;/g, 'color: var(--text-muted);'],
  [/color: #5d6b60;/g, 'color: var(--text-muted);'],
  [/color: #6c7a6c;/g, 'color: var(--text-muted);'],
  [/color: #69766b;/g, 'color: var(--text-muted);'],
  [/color: #657365;/g, 'color: var(--text-muted);'],
  [/color: #6b786c;/g, 'color: var(--text-muted);'],
  [/color: #71806f;/g, 'color: var(--text-muted);'],
  [/color: #9aa59a;/g, 'color: var(--text-muted);'],
  [/color: #244f32;/g, 'color: var(--primary-main);'],
  [/color: white;/gi, 'color: var(--text-inverse);'],
  [/color: #ffffff;/gi, 'color: var(--text-inverse);'],
  [/color: rgba\(255, 255, 255, 0.82\);/gi, 'color: var(--text-inverse); opacity: 0.82;'],

  // Borders
  [/border: 1px solid #dce7d8;/g, 'border: 1px solid var(--border-main);'],
  [/border: 1px solid #e1eadc;/g, 'border: 1px solid var(--border-light);'],
  [/border: 1px solid #dfe8db;/g, 'border: 1px solid var(--border-main);'],
  [/border-top: 1px solid #edf2e9;/g, 'border-top: 1px solid var(--border-light);'],
  [/border-bottom: 1px solid #edf2e9;/g, 'border-bottom: 1px solid var(--border-light);'],
  [/border: 1px dashed #d4e0d1;/g, 'border: 1px dashed var(--border-main);'],
  [/border-color: #244f32;/g, 'border-color: var(--primary-main);'],
  [/border-color: #e0e6dd;/g, 'border-color: var(--border-light);'],
  [/border-color: #7aa95c;/g, 'border-color: var(--border-focus);'],
  [/background: #e3ebdf;/g, 'background: var(--border-main);'],

  // Shadows
  [/box-shadow: 0 2px 8px rgba\(36, 79, 50, 0\.04\);/g, 'box-shadow: var(--shadow-sm);'],
  [/box-shadow: 0 8px 24px rgba\(36, 79, 50, 0\.08\);/g, 'box-shadow: var(--shadow-md);'],
  [/box-shadow: 0 12px 32px rgba\(36, 79, 50, 0\.12\);/g, 'box-shadow: var(--shadow-glow);'],

  // Badges
  [/background: #fff2f2;/g, 'background: var(--bg-error);'],
  [/color: #d63333;/g, 'color: var(--text-error);'],
  [/border: 1px solid #ffd1d1;/g, 'border: 1px solid var(--border-error);'],
  
  [/background: #fff8e6;/g, 'background: var(--bg-warning);'],
  [/color: #b28100;/g, 'color: var(--text-warning);'],
  
  [/background: #f2f4f2;/g, 'background: var(--bg-neutral);'],

  // Specifics
  [/background: #7aa95c;/g, 'background: var(--primary-main);'],
  [/background: #c9d2c4;/g, 'background: var(--border-main);'],
];

for (const [regex, replacement] of map) {
  css = css.replace(regex, replacement);
}

// Write the result
fs.writeFileSync('frontend/src/index.css', variables + css);
console.log('Transform complete.');
