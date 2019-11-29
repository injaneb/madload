const express = require('express');
const ytdl = require('youtube-dl');
const logger = require('../lib/logger');
const router = express.Router();

const supported = [
  'youtube.com',
  'youtu.be',
  'soundcloud.com',
  'twitter.com',
  'facebook.com',
  'instagram.com'
];

router.get('/test', (req, res) => {
  ytdl.getInfo(req.query.url, (err, info) => {
    res.json(info);
  });
});

router.all('/', (req, res) => {
  let url = req.body.url || req.query.url;

  if (!url) return res.json({ ok: false, err: 'url not found.' });

  let urlMatch = url.match(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}[.]{0,1}/i);
  if (urlMatch && urlMatch.length > 0) {
    let domainName = urlMatch[0].replace(/(http[s]?:\/\/)|(www\.)/ig, '');
    if (!supported.includes(domainName)) {
      let errmsg = `${domainName} isn't supported.`;

      res.json({
        ok: false,
        err: errmsg
      });
      return logger('error', errmsg);
    }
  }

  ytdl.getInfo(url, (err, info) => {
    if (err) {
      res.json({
        ok: false,
        err: 'error occurred when getting info.'
      });
      return logger('error', err);
    }

    const data = {
      ok: true,
      title: info.title,
      url: info.webpage_url,
      id: info.display_id,
      thumbnail: info.thumbnail,
      platform: info.extractor,
      author: {
        name: info.uploader,
        url: info.uploader_url
      },
      formats: []
    };

    // set duration
    if (info.duration.indexOf(':') !== -1) {
      data.duration = info.duration.split(':').map(t => t < 10 ? t = `0${~~t}` : ~~t).join(':');
    } else {
      data.duration = `0:${info.duration < 10 ? `0${~~info.duration}` : ~~info.duration}`;
    }

    if (data.platform !== 'soundcloud') {
      let formats = info.formats.filter(item => {
        switch (data.platform) {
          case 'youtube':
            if (item.format_note.startsWith('DASH')) return false;
            if ((item.ext === 'mp4' || item.ext === 'webm') && (item.format_note === 'tiny' || item.vcodec === 'none')) return false;
          break;

          case 'twitter':
            if (item.format_id.startsWith('hls')) return false;
          break;
        }

        return true;
      });

      if (formats.length > 1) {
        formats.forEach((item, i) => {
          // remove the id from the format
          if (item.format.startsWith(item.format_id)) item.format = item.format.replace(`${item.format_id} - `, '').trim();

          data.formats[i] = {
            url: item.url,
            ext: item.ext,
            acodec: item.acodec,
            vcodec: item.vcodec,
            format: item.format,
            formatId: item.format_id,
            formatNote: item.format_note
          };
        });
      } else {
        let item = formats[0];
        data.formats[0] = {
          url: item.url,
          ext: item.ext,
          acodec: item.acodec,
          vcodec: item.vcodec,
          format: item.format,
          formatId: item.format_id,
          formatNote: item.format_note
        };
      }
    } else {
      data.formats[0] = {
        url: info.url,
        ext: info.ext
      };
    }

    switch (data.platform) {
      case 'youtube':
        // set thumbnail
        data.thumbnail = data.thumbnail.replace('hqdefault', 'mqdefault');

        // sort by the formatNote
        data.formats.sort((a, b) => parseInt(a.formatNote) > parseInt(b.formatNote) ? -1 : 1);

        // move best formats up
        let frmt18 = data.formats.findIndex(item => item.formatId === '18');
        let frmt22 = data.formats.findIndex(item => item.formatId === '22');

        if (frmt18 !== -1) data.formats.unshift(data.formats.splice(frmt18, 1)[0]);
        if (frmt22 !== -1) data.formats.unshift(data.formats.splice(frmt22, 1)[0]);

        // move the audio up if its a music video
        if (info.categories.includes('Music')) data.formats.unshift(data.formats.splice(data.formats.findIndex(item => item.ext === 'm4a'), 1)[0]);
       break;

      case 'soundcloud':
        data.thumbnail = data.thumbnail.replace('original', 'crop');
      break;

      case 'twitter':
        // sort by width and height
        data.formats.sort((a, b) => {
          let ax = a.format.split('x');
          let bx = b.format.split('x');
          return (bx[1] - bx[0]) - (ax[1] - ax[0]);
        });
      break;
    }

    res.json(data);
  });
});

module.exports = router;
