const fs = require('fs');
let content = fs.readFileSync('app/espace-client/styles.js', 'utf8');

// The file starts with export const tailwindStyles = `
// and ends with `;\n

const lines = content.split('\n');
const newLines = lines.map((line, index) => {
  if (index === 0 && line.startsWith('export const tailwindStyles = `')) {
    return line;
  }
  if (index === lines.length - 1 && line.trim() === '`;') {
    return line;
  }
  if (index === lines.length - 2 && line.trim() === '`;') {
    return line;
  }
  // Escape backticks in content
  return line.replace(/`/g, '\\`');
});

fs.writeFileSync('app/espace-client/styles.js', newLines.join('\n'));
console.log('Successfully escaped backticks in styles.js');
