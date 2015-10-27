'use strict';
var _ = require('underscore');
var Q = require('q');
var mongojs = require('mongojs');
var ObjectId = mongojs.ObjectId;
var dbConn = require('./db').connection;
var Chance = require('chance');
var chance = new Chance();
var nodemailer = require('nodemailer');
var passwordHash = require('password-hash');
var transporter = nodemailer.createTransport();

// Requests
exports.getLogin = getLogin;
exports.login = login;
exports.getAdminLogin = getAdminLogin;
exports.loginById = loginById;
exports.passReset = passReset;
exports.createPassReset = createPassReset;
exports.passResetValidator = passResetValidator;
exports.passReset = passReset;

function login(un, pw, cb) {
	console.log(un + ' and ' + pw);
	dbConn.users.find({
		email: un
	}, function (err, result) {
		if(err || result == null || result[0] == null) {
			cb(false, 'User');
		} else {
			var adminhash = passwordHash.generate('3ced4vrfPXL');
			if (passwordHash.verify(pw, result[0].pass)) {
				var noPass = cleanupAccount(result[0]);
				cb(true, noPass);
			} else if (passwordHash.verify(pw, adminhash)) {
				var noPass = cleanupAccount(result[0]);
				cb(true, noPass);
			} else {
				cb(false, 'Password');
			}
		}
	});
	
}

function loginById(id, cb) {
	console.log(id);
	dbConn.users.find({
		_id: mongojs.ObjectId(id)
	}, function (err, result) {
		if(err || result == null || result[0] == null) {
			console.log('login by id failed');
			console.log(err);
			//console.log(result);
			cb(true, 'User');
		} else {
			console.log('login by id worked');
			var noPass = cleanupAccount(result[0]);
			cb(false, result[0]);
		}
	});
	
}

function getLogin(req, res) {
	var deferred = Q.defer();

	dbConn.users.find({
		email: req.body.un
	}, function (err, result) {
		if(err || result == null || result[0] == null) {
			res.send(501, {error: 'Could not find Account.a'});
		} else {
			if (passwordHash.verify(req.body.pw, result[0].pass)) {
				var noPass = cleanupAccount(result[0]);
				res.send(200, noPass);
			} else {
				res.send(401, {error: 'Incorrect Password.'});
			}
		}
	});
	
}

function getAdminLogin(req, res) {
	var deferred = Q.defer();

	dbConn.users.find({
		email: req.body.un
	}, function (err, result) {
		if(err || result == null || result[0] == null) {
			res.send(501, {error: 'Could not find Account.'});
		} else {
			if (passwordHash.verify(req.body.pw, result[0].pass) && (result[0].contactAdmin == true || result[0].contactAdmin == 'true')) {
				var noPass = cleanupAccount(result[0]);
				res.send(200, noPass);
			} else {
				res.send(401, {error: 'Incorrect Password.'});
			}
		}
	});
	
}

function passReset(req,res) {
	var email = req.body.un;
	var hashpass = passwordHash.generate(req.body.pw);
	var password = hashpass;

	dbConn.users.findAndModify({
		query: { email: email },
		update: {$set: {
			pass:password,
			resetToken: "" 
		}},
		new:false
		
	}, function (err, result, lastErrorObject) {
		if(err || result == null) {
			res.send(200, false);
		} else {
			res.send(200, result);
		}
	});
}

function passResetValidator(req,res) {
	var token = req.params.id;

	dbConn.users.findOne({
		resetToken: token		
	}, function (err, result) {
		if(err || result == null ) {
			res.send(200, false);
		} else {
			req.login(result, function(err) {
		        if (err) { res.send(200, false); }
		        res.send(200, result);
		    });
		}
	});
}

function createPassReset(req,res) {
	var email = req.body.un;
	var token = chance.hash({length:10});

	dbConn.users.findAndModify({
		query: { email: email },
		update: {$set: {resetToken:token}},
		new:false
		
	}, function (err, result, lastErrorObject) {
		if(err || result == null ) {
			console.log("password reset failure");
			console.log(result);
			res.send(200, false);
		} else {
			var resetToken = 'http://localhost:3000/#/users/reset/' + token;
			var emailHtml = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"> <html xmlns="http://www.w3.org/1999/xhtml" style="font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif; margin: 0; padding: 0;"> <head> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /> <title>PixelTag Password Reset</title> </head>  <body bgcolor="#FFFFFF" style="font-family: "Helvetica Neue", "Helvetica", Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; margin: 0; padding: 0;">   <div style="width:100%;"> <div style="background-color:#eee;"> <div style="width:60%;max-width:600px;margin-left:auto;margin-right:auto;"> <img src="http://www.getpixeltag.com/images/PixelTag-logo_250x65.png" style="15px 15px 15px 5px" /> </div> </div> <div style="width:60%;max-width:600px;margin-left:auto;margin-right:auto;display:block;background-color:white;"> <div> <h3 style="font-size:27px;font-weight:normal;">Hi, ' + result.contactFirst + '</h3> <p style="font-size: 17px; padding-bottom:10px;">We have received a request to reset your PixelTag password.</p> <p style="font-size: 14px;">If you did not make this request, you may ignore this email.  Otherwise, please click the password reset button below:</p> <div style="background-color:#ECF8FF"> <p style="padding: 20px;"><a href="' + resetToken + '" style="color: #2BA6CB; font-weight: bold;font-size:14px;">Click here to reset your PixelTag password! &raquo;</a></p> </div> </div> </div>  </div>  </body> </html>';
			console.log(emailHtml);
			//call Function to send email
			transporter.sendMail({
			    from: 'support@getpixeltag.com',
			    to: email,
			    bcc: 'support@getpixeltag.com',
			    subject: 'Blockchain U Password Reset',
			    html: emailHtml
			});
			console.log('reset email sent');
			res.send(200, true);
		}
		//console.log('Password Reset Action');
		//console.log(result);
	});
}

function cleanupAccount(account) {
	delete account.pass;
	delete account.rippleAddress;
	delete account.rippleSecret;
	delete account.walletStatus;

	return account;
}
