'use strict';
var express = require('express');
var env = require('../env.js');
var path = require('path');
var accounts = require('./accounts');
var login = require('./login');
var config = require('./config');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var dbConn = require('./db').connection;
var cors = require('cors');

var port = process.env.PORT || 3000;
var files = process.env.FILES || '../app';
var files2 = '../frontend2';
var fonts = process.env.FONTS || '../frontend/css/fonts';

var server = express(); // better instead

// Define our static file directory, it will be 'public'
var staticFilePath = path.join(__dirname, files);
var staticFilePath2 = path.join(__dirname, files2);
var staticFontPath = path.join(__dirname, fonts);

server.use('/', express.static(staticFilePath));
server.use('/fonts', express.static(staticFontPath));
server.use('/index', express.static(staticFilePath2));
server.use('/index/fonts', express.static(staticFontPath));
//server.options('*', cors());
server.configure(function() {
  // server.use(express.logger());
  server.use(express.bodyParser({limit: '10mb'}));
  server.use(express.cookieParser());

  server.use(express.cookieSession({ secret: 'runningrunningandrunningrunning', cookie: { maxAge: 60*60*1000 }}));
  server.use(passport.initialize());
  server.use(passport.session());
  server.use(function (req, res, next) {
    if (req.headers.origin != null) {
      if (req.headers.origin.match(/localhost/)) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      }
    }
    // Website you wish to allow to connect
    //res.setHeader('Access-Control-Allow-Origin', 'http://pixeltagapp.herokuapp.com');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
  });

  //server.use(cors());

});

//Passport Information
passport.use(new LocalStrategy( {
	usernameField: 'un',
	passwordField: 'pw'
	},
  function(username, password, done) {

  	login.login(username, password, function (worked, result) {
  		if (worked) {
  			return done(null, result);
  		} else {
  			if (result == 'User') {
  				return done(null, false, { message: 'Incorrect username.' });
  			} else {
  				return done(null, false, { message: 'Incorrect password.' });
  			}
  		}
  	});
  }
));

//Session Management

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (_id, done) {
  login.loginById(_id, function(err, user) {
    done(err, user);
  });
});



// login
server.post('/api/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return next(err); 
    }
    if (!user) {
      //req.flash('error', info.message);

      return res.send('failure');
    }
    req.logIn(user, function(err2) {
      if (err2) { return next(err2); }
      return  res.send(user);
    });
  }
  )(req, res, next);
});
server.get('/api/logout', logoutUser);
//password management
server.post('/api/passwordResetCreator', login.createPassReset);
server.get('/api/passwordResetValidator/:id', login.passResetValidator);
server.post('/api/passwordReset', headerSet, ensureAuthenticated, login.passReset);

// accounts
server.get('/api/accounts', headerSet, accounts.getAccounts);
server.get('/api/account/:id', headerSet, ensureAuthenticated, accounts.getAccountById);
server.post('/api/account/create', headerSet, accounts.createAccount);
server.post('/api/account/usercreate', headerSet, accounts.userCreateAccount, function (req, res, next) {
  dbConn.accounts.findOne({email: req.body.accountData.email}, function (err2, result) {
    if (!err2) {
      var noPass = result;
      delete noPass.contactPass;
      req.login(noPass, function(err) {
        if (err) { 
          return next(err); 
        }
        return res.send(noPass);
      });
    } else {
      res.send(501, {error: 'Error creating account: ' + err2});
    }             
  });           
});
// server.get('/api/account/archive/:id', accounts.archiveAccount);
server.get('/api/account/remove/:id', headerSet, ensureAuthenticated, accounts.removeAccount);
server.post('/api/account/update', headerSet, ensureAuthenticated, accounts.updateAccounts);

server.listen(port);
console.log('Server is rocking on port ' + port);

function headerSet(req, res, next) {
  if (req.method === 'OPTIONS') {
      // add needed headers
      var headers = {};
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
      headers["Access-Control-Allow-Credentials"] = true;
      // respond to the request
      res.writeHead(200, headers);
      res.end();
  } else {
    return next();
  }
  
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); 
  } else {
    res.send(401);
  }  
}

function logoutUser (req, res) {
  req.logout();
  res.send(200, true);
}
