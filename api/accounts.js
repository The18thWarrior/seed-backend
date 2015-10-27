'use strict';
var _ = require('underscore');
var Q = require('q');
var mongojs = require('mongojs');
var ObjectId = mongojs.ObjectId;
var dbConn = require('./db').connection;
var passwordHash = require('password-hash');
var rippleAccount = require('./ripple/accounts.js');
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'eVBmR7gN';


// Requests
exports.getAccounts = getAccounts;
exports.getAccountById = getAccountById;
exports.createAccount = createAccount;
exports.removeAccount = removeAccount;
exports.userCreateAccount = userCreateAccount;
exports.updateAccounts = updateAccounts;

// services
exports.accountById = accountById;

function getAccounts(req, res) {
	try {
		dbConn.users.find({
		}, function(err, accounts) {
			if(err || !accounts) {
				res.send(501, {error: 'Error finding accounts: ' + err});
			} else {
				res.send(200, accounts);
			}
		});
	} catch(e) {
		res.send(501, {error: 'Error finding accounts' + e});
	}
}

function getAccountById(req, res) {
	
	dbConn.users.findOne({
		_id: new ObjectId(req.params.id)
	}, function(err, account) {
		if(err || !account) {
			res.send(501, {error: 'Error finding account: ' + err});
		} else {
			var noPass = cleanupAccount(account);
			res.send(200, noPass);
		}
	});

	/*
	accountById(req.params.id)
	.then(function success(account) {
		var noPass = newAccount;
		delete noPass.contactPass;
		res.send(200, noPass);
	}, function error(err) {
		res.send(501, {error: 'Error finding account: ' + err});
	});*/
}

function updateAccounts (req, res) {
	var accountData = _.pick(req.body.accountData, [
		'first',
		'last',
		'email',
		'notes',
		'_id'
	]);

	dbConn.users.findAndModify( {
		query: {_id:mongojs.ObjectId(req.body.accountData._id)},
		update: { $set: accountData },
		new: true
	}, 
		function (err, updatedAccount, last) {
			if (err) {
				res.status(501).send('Error updating account.');
			} else {
				var noPass = cleanupAccount(updatedAccount);
				res.send(200, noPass);
			}
		}
	);
}

function createAccount(req, res) {
	console.log('creating account');
	var newAccountData = _.pick(req.body.accountData, [
		'first',
		'last',
		'email',
		'pass'
	]);
	var hashpass = passwordHash.generate(newAccountData.pass);
	newAccountData.pass = hashpass;
	newAccountData.notes = "";
	newAccountData.avatar_url = "img/basicAvatar.png";
	rippleAccount.newWallet(function (error, wallet) {
		if (error) {
			res.status(400).send({error: 'Error creating wallet'});
		} else {
			newAccountData.rippleAddress = encrypt(wallet.account.address);
			newAccountData.rippleSecret = encrypt(wallet.account.secret);

			dbConn.users.save(
				newAccountData,
				function onInsertCompelete(err, newAccount) {
					console.log(err);
					console.log(newAccount);
					if(err) {
						res.send(501, {error: 'Error creating account: ' + err});
					} else {
						payments.fundWallet(newAccountData.rippleAddress, function onComplete(error3, statusUrl) {
							if (error3) {
								console.log('Wallet funding failed');
							} else {
								var noPass = cleanupAccount(newAccount);
								res.send(200, noPass);
								payments.confirmPayment(statusUrl, function confirmComplete(error2, worked) {
									if (error2) {
										console.log('Wallet confirmation failed');
									} else {
										dbConn.users.update({
												email: assetData.email
											}, 
											{ $set: {
													walletStatus: 'Funded',
													currentBalance: 100
												}}, 
											{}, 
											function onInsertComplete() {
												console.log('Assets Updated');
												
											}
										);
									}
								});
							}
						});
					}
				}
			);
		}
	});
			
}

function userCreateAccount(req, res, next) {
	var newAccountData = _.pick(req.body.accountData, [
		'first',
		'last',
		'email',
		'pass'
	]);

	var hashpass = passwordHash.generate(newAccountData.pass);
	newAccountData.pass = hashpass;
	newAccountData.notes = "";

	dbConn.users.find({
		email: newAccountData.email
	}, function(err, result) {
		if (result == true) {
			res.send(510, {error: 'User emails must be unique.'});
		} else {
			dbConn.users.save(
				newAccountData,
				function onInsertCompelete(err, newAccount) {
					if(err) {
						res.send(501, {error: 'Error creating account: ' + err});
					} else {
						dbConn.users.findOne({email: newAccountData.email}, function (err2, result) {
							if (!err2) {
								var noPass = result;
								delete noPass.pass;
								res.status(200).send(noPass);
							} else {
								res.send(501, {error: 'Error creating account: ' + err2});
							}							
						});						
					}
				}
			);
		}
	});
}

function removeAccount(req, res) {
	dbConn.users.remove({
		_id: new ObjectId(req.params.id)
	}, function onRemoveCompelete(err, result) {
		if(err) {
			res.send(501, {error: 'Unknown Error finding account: ' + err});
		} else if(result === 0){
			res.send(404, {error: 'Could not find account or account already removed'});
		} else {
			res.send(200);
		}
	});
}

function accountById(accountId) {
	var deferred = Q.defer();


	dbConn.users.findOne({
		_id: new ObjectId(accountId)
	}, function(err, account) {
		if(err || !account) {
			deferred.reject(err);
		} else {
			deferred.resolve(account);
		}
	});
	return deferred.promise;
}

/* Helper Functions */

function cleanupAccount(account) {
	delete account.pass;
	delete account.rippleAddress;
	delete account.rippleSecret;
	delete account.walletStatus;

	return account;
}

function encrypt(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function decrypt(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}
