var mongojs = require('mongojs');
var databaseUrl= process.env.MONGO_URI ||'mongodb://localhost:5000';
var collections = ['users' ];

exports.url = databaseUrl;
exports.connection = mongojs.connect(databaseUrl, collections);

