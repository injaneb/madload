'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const effects = {
    fadeIn: (element, step = .1, showIt = true) => {
      if (step >= 1) step = +('.' + step);
      if (showIt) element.hasAttribute('hidden') && element.removeAttribute('hidden');

      let opacityVal;
      element.style.opacity = 0;
      function fade() {
        opacityVal = +element.style.opacity;

        if ((opacityVal += step) <= 1) {
          element.style.opacity = opacityVal;
          (window.requestAnimationFrame && requestAnimationFrame(fade)) || setTimeout(fade, 16);
        } else {
          if (+element.style.opacity !== 1) element.style.opacity = 1;
        }
      }
      (window.requestAnimationFrame && requestAnimationFrame(fade)) || setTimeout(fade, 16);

      return true;
    },

    fadeOut: (element, step = .1, hideIt = true) => {
      if (step >= 1) step = +('.' + step);
      element.style.opacity = 1;

      let opacityVal;
      function fade() {
        opacityVal = +element.style.opacity;

        if ((opacityVal -= step) >= 0) {
          element.style.opacity = opacityVal;
          (window.requestAnimationFrame && requestAnimationFrame(fade)) || setTimeout(fade, 16);
        } else {
          if (+element.style.opacity !== 0) element.style.opacity = 0;
          if (hideIt) !element.hasAttribute('hidden') && element.setAttribute('hidden', '');
        }
      }
      (window.requestAnimationFrame && requestAnimationFrame(fade)) || setTimeout(fade, 16);

      return true;
    }
  };

  function isValidUrl(url) {
    if (!url) return false;

    const supportedSites = [
      'youtube.com',
      'youtu.be',
      'soundcloud.com',
      'twitter.com',
      'facebook.com',
      'instagram.com'
    ];

    let urlMatch = url.match(/^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}[.]{0,1}/i);
    if (urlMatch && urlMatch.length > 0 && supportedSites.includes(urlMatch[0].replace(/(http[s]?:\/\/)|(www\.)/ig, ''))) {
      return true;
    }

    return false;
  }

  let isProcessing = false;

  let urlInput  = document.getElementById('url'),
      submitBtn = urlInput.nextElementSibling,
      clipPaste = document.getElementById('clipPaste'),
      clrInput  = document.getElementById('clrInput'),
      outputBox = document.getElementById('output');

  function prepareForm(url, getData = false) {
    submitBtn.hasAttribute('disabled') && submitBtn.removeAttribute('disabled');
    if (urlInput.value !== url) urlInput.value = url;
    if (location.hash  !== url) location.hash  = url;
    if (getData) submitBtn.click();
  }

  !urlInput.getAttribute('data-placeholder') && urlInput.setAttribute('data-placeholder', urlInput.getAttribute('placeholder'));

  // hide the placeholder content
  urlInput.addEventListener('focus', () => {
    urlInput.setAttribute('placeholder', '');
    if (urlInput.value.trim() && urlInput.select) urlInput.select();
  });

  // show the placeholder content again
  urlInput.addEventListener('blur', () => urlInput.setAttribute('placeholder', urlInput.getAttribute('data-placeholder')));

  // copy input value
  urlInput.addEventListener('dblclick', () => {
    if (!urlInput) return;

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      let input = document.createElement('input');
      input.value = urlInput.value;
      input.style.display = 'none';
      document.body.appendChild(input);
      input.focus();
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return;
    }

    navigator.permissions.query({ name: 'clipboard-write' }).then(result => {
      if (result.state === 'granted' || result.state === 'prompt') navigator.clipboard.writeText(urlInput.value);
    });
  });

  urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim();

    // handle clear the input using backspace/delete
    if (!url) {
      !submitBtn.hasAttribute('disabled') && submitBtn.setAttribute('disabled', '');
      !clrInput.hasAttribute('hidden') && effects.fadeOut(clrInput);
      !clipPaste.hasAttribute('not-supported') && clipPaste.hasAttribute('hidden') && effects.fadeIn(clipPaste);
      // location.hash = '';
      return;
    }

    // hide the clipPaste & show the clrInput
    !clipPaste.hasAttribute('hidden') && effects.fadeOut(clipPaste);
    clrInput.hasAttribute('hidden')   && effects.fadeIn(clrInput);

    // check if the url is valid and get results
    if (isValidUrl(url)) prepareForm(url, true);
  });

  // urlInput.addEventListener('change', () => (!isProcessing && isValidUrl(urlInput.value.trim())) && submitBtn.click());

  // get the url from the hash if exists
  if (location.hash) {
    const url = location.hash.trim().substr(1);
    if (!urlInput.value.trim() && isValidUrl(url)) {
      // hide the clipPaste & show the clrInput
      !clipPaste.hasAttribute('hidden') && effects.fadeOut(clipPaste);
      clrInput.hasAttribute('hidden') && effects.fadeIn(clrInput);

      prepareForm(url);
    }
  }


  // check if browser supports clipboard readText
  if (navigator.clipboard && navigator.clipboard.readText) {
    !urlInput.value.trim() && clipPaste.hasAttribute('hidden') && clipPaste.removeAttribute('hidden');
    clipPaste.hasAttribute('not-supported') && clipPaste.removeAttribute('not-supported');
  } else {
    !clipPaste.hasAttribute('hidden') && clipPaste.setAttribute('hidden', '');
    !clipPaste.hasAttribute('not-supported') && clipPaste.setAttribute('not-supported', '');
  }


  clipPaste.addEventListener('click', () => {
    if (clipPaste.hasAttribute('not-supported')) return !clipPaste.hasAttribute('hidden') && clipPaste.setAttribute('hidden', '');

    navigator.permissions.query({ name: 'clipboard-read' }).then(result => {
      if (result.state === 'granted' || result.state === 'prompt') {
        navigator.clipboard.readText().then(text => {
          const url = text.trim();

          if (!url) return;

          urlInput.value = url;

          if (isValidUrl(url)) prepareForm(url, true);

          effects.fadeOut(clipPaste);
          setTimeout(() => clrInput.hasAttribute('hidden') && effects.fadeIn(clrInput) && clipPaste.hasAttribute('style') && clipPaste.removeAttribute('style'), 100);
        });
      }
    });
  });


  clrInput.addEventListener('click', () => {
    urlInput.value = '';
    // location.hash = '';

    !submitBtn.hasAttribute('disabled') && submitBtn.setAttribute('disabled', '');

    clrInput.style.transform = 'rotate(-90deg)';
    setTimeout(() => effects.fadeOut(clrInput), 500);
    setTimeout(() => !clipPaste.hasAttribute('not-supported') && clipPaste.hasAttribute('hidden') && effects.fadeIn(clipPaste) && clrInput.hasAttribute('style') && clrInput.removeAttribute('style'), 600);
  });

  window.addEventListener('hashchange', () => {

  });


  let videoCard     = outputBox.querySelector('.video-card'),
      thumbnailWrap = videoCard.querySelector('.thumbnail'),
      infoWrap      = videoCard.querySelector('.info'),
      downloadWrap  = videoCard.querySelector('.download');

  let thumbnailImg = thumbnailWrap.querySelector('img'),
      infoTitle    = infoWrap.querySelector('.title a'),
      infoAuthor   = infoWrap.querySelector('.author a');

  let formatsList  = downloadWrap.querySelector('.formats-list'),
      dropIcon     = downloadWrap.querySelector('.drop-icon'),
      getBtn       = downloadWrap.querySelector('.get');

  let loadingWrap = outputBox.querySelector('.loading'),
      errBoxWrap  = outputBox.querySelector('.errbox'),
      errBoxMsg   = errBoxWrap.querySelector('.err-msg');


  function setFormatItem(format, filename, cb) {
    let item = document.createElement('li');

    // set the formats info
    item.setAttribute('title', format.format);
    item.setAttribute('data-url', format.url);
    item.setAttribute('data-ext', format.ext);
    item.setAttribute('data-filename', filename.replace(/\|\\\/\*\+<>:\?"'/g, '_')); //  `${filename.replace(/\|\\\/\*\+<>:\?"'/g, '_')}.${format.ext}`

    // set the item name
    item.textContent = `${format.ext.toUpperCase()}`;

    // customize the the format note
    if (format.ext === 'm4a' || format.ext === 'mp3') {
      item.textContent += ' (audio)';
    } else if (format.formatNote) {
      item.textContent += ` (${format.formatNote})`;
    }

    // add no-[audio/video] for formats
    if (format.acodec === 'none') item.classList.add('no-audio');
    // if (format.vcodec === 'none') item.classList.add('no-video');

    cb && cb(item);

    formatsList.appendChild(item);
  }

  function showErrorMsg(errmsg, disableProcessing = true) {
    if (!errmsg) return false;

    if (!loadingWrap.hasAttribute('hidden') || !videoCard.hasAttribute('hidden')) {
      !loadingWrap.hasAttribute('hidden') && effects.fadeOut(loadingWrap);
      !videoCard.hasAttribute('hidden')   && effects.fadeOut(errBoxWrap);
      setTimeout(() => effects.fadeIn(errBoxWrap), 300);
    } else {
      errBoxWrap.hasAttribute('hidden') && effects.fadeIn(errBoxWrap);
    }

    if (disableProcessing) isProcessing = false;

    errBoxMsg.textContent = errmsg;
  }


  formatsList.addEventListener('click', () => {
    if (!formatsList.childElementCount || formatsList.childElementCount === 1) return;
    if (formatsList.hasAttribute('data-list-open')) return formatsList.removeAttribute('data-list-open');
    formatsList.setAttribute('data-list-open', '');
  });

  document.addEventListener('click', e => {
    // hide the formats list menu when click wherever outside
    if (formatsList.hasAttribute('data-list-open') && formatsList !== e.target.parentElement && dropIcon !== e.target.parentElement) formatsList.removeAttribute('data-list-open');
  });

  getBtn.addEventListener('click', () => {
    let selected = formatsList.firstElementChild;
    let a = document.createElement('a');
    a.style.display = 'none';
    a.setAttribute('download', selected.getAttribute('data-filename'));
    a.setAttribute('href', selected.getAttribute('data-url'));
    // a.setAttribute('target', '_blank');

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  submitBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();

    if (isProcessing) return;

    if (!url || !isValidUrl(url)) {
      !submitBtn.hasAttribute('disabled') && submitBtn.setAttribute('disabled', '');
      return showErrorMsg('Please insert a valid url.');
    }

    isProcessing = true;

    submitBtn.hasAttribute('disabled') && submitBtn.removeAttribute('disabled');
    outputBox.hasAttribute('hidden')   && outputBox.removeAttribute('hidden');

    if (!videoCard.hasAttribute('hidden') || !errBoxWrap.hasAttribute('hidden')) {
      effects.fadeOut(videoCard);
      effects.fadeOut(errBoxWrap);
      setTimeout(() => effects.fadeIn(loadingWrap), 300);
    } else {
      effects.fadeIn(loadingWrap);
    }

    // starting the drama
    fetch('/api', {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    }).then(res => {
      if (res.ok && (res.status >= 200 && res.status < 300) && res.statusText === 'OK') {
        return res.json();
      } else {
        throw 'server request error, check your connection and try again.';
      }
    }).then(data => {
      if (!data || !data.ok) return showErrorMsg(data && data.err || 'error occurred when getting info.');

      thumbnailWrap.querySelector('.duration').textContent = data.duration;

      infoTitle.setAttribute('href', data.url);
      infoTitle.textContent = data.title;

      infoAuthor.setAttribute('href', data.author.url);
      infoAuthor.textContent = data.author.name;

      // remove old formats list
      while (formatsList.firstElementChild) formatsList.removeChild(formatsList.firstElementChild);

      if (data.formats && data.formats.length > 1) {
        // show the drop[down/up] icon
        dropIcon.hasAttribute('hidden') && dropIcon.removeAttribute('hidden');

        // create formats elements
        data.formats.forEach(format => {
          setFormatItem(format, data.title, item => {
            // selector
            item.addEventListener('click', () => {
              if (item === formatsList.firstElementChild) return;
              formatsList.firstElementChild.insertAdjacentElement('beforebegin', item);
            });
          });
        });
      } else if (data.dl) {
        // hide the drop[down/up] icon
        !dropIcon.hasAttribute('hidden') && dropIcon.setAttribute('hidden', '');

        // set the format item
        setFormatItem(data.dl, data.title);
      } else {
        showErrorMsg('connot get media data.');
      }

      // set the thumbnail image
      thumbnailImg.setAttribute('src', data.thumbnail);


      if (!loadingWrap.hasAttribute('hidden')) {
        effects.fadeOut(loadingWrap);
        setTimeout(() => effects.fadeIn(videoCard), 300);
      } else {
        effects.fadeIn(videoCard);
      }

      isProcessing = false;
    }).catch(err => {
      showErrorMsg('request error occurred.');
      console.error(err);
    });
  });
});
