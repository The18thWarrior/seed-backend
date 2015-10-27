'use strict'
var config = require('./config.js');
var http = require('https');

exports.getBalances = getBalances;
exports.newWallet = newWallet;

function getBalances(address, callback) {
	//Initialize request
	console.log('running get balances');
	var urlPath = '/v1/accounts/' + address + '/balances';
	var totalUrl = 'https://' +config.hosts + urlPath;
	console.log(totalUrl);
	
	var options = {
		host: config.hosts,
		path: urlPath,
		method: 'GET',
		rejectUnauthorized: false,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Accept-Encoding': 'gzip,deflate,sdch'
		}
	};


	var errorcheck = true;

	// Set up the request
	var post_req = http.request(options, function(res) {
	  res.setEncoding('utf8');
	  var str = '';
	  
	  res.on('data', function (chunk) {
	  		//console.log(chunk);
			str += chunk;	
		});

	  res.on('error', function (error) {
	  		console.log("error: " + error.message);	  
	  		errorcheck = false;		
	  });

		res.on('end', function () {
		  	if (errorcheck) {
		  		var balances = JSON.parse(str);
		  		callback(false, balances);
		  	} else {
		  		callback(true, 'failure');
		  	}
		});
	});
	post_req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		console.log(e);
		errorcheck = false;
		callback(true, 'failure');	
	});

	// post the data
	post_req.end();
}

function newWallet(callback) {
	//Initialize request
	console.log('running get balances');
	var urlPath = '/v1/wallet/new';
	var totalUrl = 'https://' +config.hosts + urlPath;
	console.log(totalUrl);
	
	var options = {
		host: config.hosts,
		path: urlPath,
		method: 'GET',
		rejectUnauthorized: false,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Accept-Encoding': 'gzip,deflate,sdch'
		}
	};


	var errorcheck = true;

	// Set up the request
	var post_req = http.request(options, function(res) {
	  res.setEncoding('utf8');
	  var str = '';
	  
	  res.on('data', function (chunk) {
	  		//console.log(chunk);
			str += chunk;	
		});

	  res.on('error', function (error) {
	  		console.log("error: " + error.message);	  
	  		errorcheck = false;		
	  });

		res.on('end', function () {
		  	if (errorcheck) {
		  		var rawResult = JSON.parse(str);
		  		var wallet = rawResult.wallet;
		  		/*************** Add wallet activation by transferring from PACER master wallet ***********/
		  		console.log(wallet);
		  		callback(false, wallet);
		  	} else {
		  		callback(true, 'failure');
		  	}
		});
	});
	post_req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		console.log(e);
		errorcheck = false;
		callback(true, 'failure');	
	});

	// post the data
	post_req.end();
}