'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var expect = require('chai').expect;
var cors = require('cors');
const mongoose = require('mongoose');

var fccTestingRoutes = require('./routes/fcctesting.js');
var runner = require('./test-runner');

const helmet = require('helmet');

// connenct to mongoDb
require('dotenv').config();

require('./models/Stock');
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('mongoDb connected'))
  .catch(err => console.log(err));

const app = express();
app.set('trust proxy', true); // ip

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only
// app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'hyperdev.com', 'glitch.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ['code.jquery.com', "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:', 'fonts.gstatic.com', 'fonts.googleapis.com'],
    },
  }),
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//Index page (static HTML)
app.route('/').get(function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//For FCC testing purposes
fccTestingRoutes(app);

var apiRoutes = require('./routes/api.js');
//Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res
    .status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
// process.env.NODE_ENV = 'test';
app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port ' + process.env.PORT);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function() {
      try {
        runner.run();
      } catch (e) {
        var error = e;
        console.log('Tests are not valid:');
        console.log(error);
      }
    }, 3500);
  }
});

module.exports = app; //for testing
