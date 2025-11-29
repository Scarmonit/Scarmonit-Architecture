const fs = require('fs');
const css = require('./css-content.js');
fs.writeFileSync('src/index.css', css);
console.log('Done');

