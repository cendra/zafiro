'use strict';

var express = require('express');
//var controller = require('./zafiro.controller');
var fs = require('fs');
var path = require('path');
var async = require('async');
var config = require('../../config/environment');
var appsPath = path.join(config.root, 'apps');
var extend = require('extend');

var router = express.Router();

router.get('/module', function (req, res, next) {
	fs.readdir(appsPath, function(err, modules) {
		if(err) return next(err);
		async.map(modules, function(module, cb) {
			fs.stat(path.join(appsPath, module, 'module.json'), function(err, stat) {
				if(!err && stat.isFile()) {
					return cb(null, {type: 'module', name: module, url: module, parent: 'root'});
				}
				cb();
			});
		}, function(err, modules) {
			res.json(modules.filter(function(item) {return !!item}));
		});
	});
});

router.get('/module/:module', function(req, res, next) {
	fs.readFile(path.join(appsPath, req.params.module, 'module.json'), function(err, moduleText) {
		if(err) return next(err);
		try {
			var module = JSON.parse(moduleText);
		} catch(err) {
			return next(err);
		}
		if(!module.routes) return next('No routes defined for module');
		module.routes.files = module.routes.files||[];
		module.routes.files.concat(module.files||[]);
		module.routes.name = req.params.module;
		res.json(module);
	});
});

router.post('/login', function(req, res, next) {
	
});

module.exports = router;

