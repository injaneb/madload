const path = require('path');
const { execFile } = require('child_process');

const ytdlexe = path.join(__dirname, 'node_modules', 'youtube-dl', 'bin', 'youtube-dl.exe');

execFile(ytdlexe, ['-U'], (err, data) => {
  if (err) throw err;

  console.log(data);
});
