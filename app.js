'use strict';

const express     = require('express');
const path        = require('path');
const morgan      = require('morgan');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// static files
app.use('/assets', express.static(path.join(__dirname, 'public')));

// ejs view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('view options', {
  delimiter: '?',
  localsName: 'data',
  _with: false,
  compileDebug: false,
  rmWhitespace: true
});

app.use(morgan('tiny'));

app.use(helmet());
app.use(helmet.noCache());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ['\'self\''],
    imgSrc: ['*'],
    mediaSrc: ['*']
  }
}));

app.use(cors());

app.use(compression());

// API route
app.use('/api', require('./routes/api'));

// home page
app.get('/', (req, res) => res.render('index'));

// not found (404)
app.use((req, res) => res.status(404).render('404', {  url: req.path }));

app.listen(PORT, () => console.log(`running on: ${PORT}`));
