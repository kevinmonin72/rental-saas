const fs = require('fs');

const css = fs.readFileSync('./app/espace-client/styles-compiled.css', 'utf8');
const escapedCss = css.replace(/\\/g, '\\\\');
const js = `export const tailwindStyles = \`\n${escapedCss}\n\`;`;

fs.writeFileSync('./app/espace-client/styles.js', js);
console.log('Successfully updated styles.js');
console.log('Successfully updated styles.js');
