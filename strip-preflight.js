const fs = require('fs');
let content = fs.readFileSync('app/espace-client/styles.js', 'utf8');

// The preflight ends at [hidden]:where(:not([hidden="until-found"])) { display: none; }
const preflightEndStr = '[hidden]:where(:not([hidden="until-found"])) {\n  display: none;\n}\n';

const splitIndex = content.indexOf(preflightEndStr);

if (splitIndex !== -1) {
  const prefix = content.substring(0, content.indexOf('*, ::before, ::after {'));
  const suffix = content.substring(splitIndex + preflightEndStr.length);
  fs.writeFileSync('app/espace-client/styles.js', prefix + suffix);
  console.log('Successfully stripped preflight from styles.js');
} else {
  console.log('Preflight not found or already stripped.');
}
