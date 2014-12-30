/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var session = require('express-session');
var fs = require('fs');
var path = require('path');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
require('./config/express')(app);

var sessionMiddleware = session({secret: '00b5f339983cc73076fa4ffc34b5e2bd', resave: false, saveUninitialized: false});

app.use(sessionMiddleware);

app.use(function(req, res, next) {
	try {
		var appName = req.path.split('/')[1];

		if(!appName) throw "sin nombre de app";

		if(!fs.statSync(path.resolve(config.root, 'apps', appName)).isDirectory()) throw "No se encontro directorio de app";

	} catch(error) {
		var hostName = req.host.split('.')[0];
		console.log(appName+' '+hostName);
		if(hostName == appName) {
			return next('No application found');
		}
		return res.redirect('/'+hostName+req.path);
	}
	
	if(!appName || !appStat || !appStat.isDirectory()) {
		console.log(req.hostname+' '+req.host);
		
	}
	if(!req.session.app || req.path.split('/')[1] != req.session.app) {

	}
	next();
});

socketio.use(function(socket, next) {
	//sessionMiddleware(socket.request, socket.request.res, next);
});

require('./config/socketio')(socketio);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;