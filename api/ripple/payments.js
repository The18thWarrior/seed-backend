'use strict'
var config = require('./config.js');
var http = require('https');
var masterWallet = config.getMasterWalletInfo();

exports.fundWallet = fundWallet;
exports.confirmPayment = confirmPayment;

function fundWallet(address, callback) {
	//Prepare UUID 
	getUuid(function uuidRetrived (error2, uuid) {
		//Prepare Payment
		preparePayment(address, function paymentPrepared (error3, payment) {
			//Initialize request
			//console.log('running get balances');
			var urlPath = '/v1/accounts/' + masterWallet.address + '/payments';
			//var totalUrl = 'https://' +config.hosts + urlPath;
			//console.log(totalUrl);
			
			var options = {
				host: config.hosts,
				path: urlPath,
				method: 'POST',
				rejectUnauthorized: false,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Accept-Encoding': 'gzip,deflate,sdch'
				}
			};


			var errorcheck = true;

			var post_data = JSON.stringify({
			    'secret' : masterWallet.secret,
			    'client_resource_id': uuid,
			    'payment': payment
			});


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
				  		var results = JSON.parse(str);
				  		callback(false, results.status_url);
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
			post_req.write(post_data);
			post_req.end();
		});
	});	
}

function preparePayment(address, callback) {
	//Initialize request
	console.log('running get balances');
	var urlPath = '/v1/accounts/' + masterWallet.address + '/payments/paths/' + address + '/22+XRP';
	//var totalUrl = 'https://' +config.hosts + urlPath;
	//console.log(totalUrl);
	
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
		  		var results = JSON.parse(str);
		  		callback(false, results.payments[0]);
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

function getUuid(callback) {
	//Initialize request
	console.log('running get balances');
	var urlPath = '/v1/uuid';
	//var totalUrl = 'https://' +config.hosts + urlPath;
	//console.log(totalUrl);
	
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
		  		var results = JSON.parse(str);
		  		callback(false, results.uuid);
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

function confirmPayment(url, callback) {
	//Initialize request
	console.log('running get balances');
	var urlPath = url;
	//var totalUrl = 'https://' +config.hosts + urlPath;
	//console.log(totalUrl);
	
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
		  		var results = JSON.parse(str);
		  		if (results.payment.result == 'tesSUCCESS') {
		  			callback(false, true);
		  		} else {
		  			confirmPayment(url, callback);
		  		}
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
