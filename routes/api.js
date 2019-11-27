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

router.use(require('cors')());

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
      duration: info.duration.split(':').map(t => t < 10 ? t = `0${~~t}` : ~~t).join(':'),
      platform: info.extractor,
      author: {
        name: info.uploader,
        url: info.uploader_url
      },
      dl: {
        url: info.url,
        ext: info.ext,
        acodec: info.acodec,
        vcodec: info.vcodec,
        format: info.format,
        formatId: info.format_id,
        formatNote: info.format_note
      }
    };

    if (data.platform !== 'soundcloud') {
      let formats = info.formats.filter(format => {
       switch (data.platform) {
          case 'youtube':
            if (format.format_note.startsWith('DASH') && parseInt(format)) return false;
            if ((format.ext === 'mp4' || format.ext === 'webm') && (format.format_note === 'tiny' || format.vcodec === 'none')) return false;
          break;

          case 'twitter':
            if (format.format_id.startsWith('hls')) return false;
          break;
        }

        return true;
      });

      if (formats.length > 1) {
        data.formats = [];
        formats.forEach((format, i) => {
          data.formats[i] = {
            url: format.url,
            ext: format.ext,
            acodec: format.acodec,
            vcodec: format.vcodec,
            format: format.format,
            formatId: format.format_id,
            formatNote: format.format_note
          };
        });
        // .sort((a, b) => ((a.acodec !== 'none' && a.vcodec !== 'none') && (b.acodec !== 'none' || b.vcodec !== 'none')) ? -1 : 1)
      }
    }


    switch (data.platform) {
      case 'youtube':
        data.thumbnail = data.thumbnail.replace('hqdefault', 'mqdefault');
        // resort the data.formats
        data.formats.sort((a, b) => parseInt(a.formatNote) > parseInt(b.formatNote) ? -1 : 1);

        // move the audio (m4a format) up if its a music video
        if (info.categories.includes('Music')) data.formats.unshift(data.formats.splice(data.formats.findIndex(format => format.ext === 'm4a'), 1)[0]);
       break;

      case 'soundcloud':
        data.thumbnail = data.thumbnail.replace('original', 'crop');
      break;
    }

    res.json(data);
  });
});

module.exports = router;
