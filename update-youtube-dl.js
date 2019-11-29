'use strict';

const downloader = require('youtube-dl/lib/downloader');
const path = require('path');

const binDir = path.join(__dirname, 'node_modules', 'youtube-dl', 'bin');

downloader(binDir, (err, done) =>{
  if (err) throw err;

  console.log(done);
});
