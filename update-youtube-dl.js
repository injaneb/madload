const path = require('path');
const { execFile } = require('child_process');

const file = path.join(__dirname, 'node_modules', 'youtube-dl', 'bin', 'youtube-dl.exe');

execFile(file, ['-U'], (err, data) => {
  if (err) throw err;

  console.log(data);
});
