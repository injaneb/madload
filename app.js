const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 5000;

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// set static folder for js/css/img
app.use('/assets', express.static(path.join(__dirname, 'public')));

// view template stuff
app.set('view engine', 'ejs');
app.set('view options', {
  delimiter: '?',
  localsName: 'data',
  _with: false,
  compileDebug: false,
  rmWhitespace: true
});
app.set('views', path.join(__dirname, 'views'));

// helmet: set some security headers
app.use(require('helmet')());

// other headers
app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': 'default-src \'self\'; img-src *; media-src *',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '-1',
  });
  next();
});

// set compression
app.use(require('compression')());

// API route
app.use('/api', require('./routes/api'));

app.get('/', (req, res) => res.render('index'));

app.use((req, res) => res.status(404).render('404', { url: req.path }));

app.listen(PORT, () => console.log(`running on: ${PORT}`));
