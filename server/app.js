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
//mongoose.connect(config.mongo.uri, config.mongo.options);

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
