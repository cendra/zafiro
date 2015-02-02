'use strict';

var express = require('express');
var controller = require('./zafiro.controller');
var fs = require('fs');
var path = require('path');
var async = require('async');
var config = require('../../config/environment');
var appsPath = path.join(config.root, 'apps');
var extend = require('extend');

var router = express.Router();

/*router.get('/', controller.index);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);
*/
router.get('/module', function (req, res, next) {
	fs.readdir(appsPath, function(err, modules) {
		if(err) return next(err);
		async.map(modules, function(module, cb) {
			console.log(config.root);
			console.log(appsPath+' '+module);
			console.log(path.join(appsPath, module, 'module.json'));
			fs.stat(path.join(appsPath, module, 'module.json'), function(err, stat) {
				console.log(err);
				console.log(stat+' '+((stat&&stat.isFile())||''));
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
		module.routes.files = module.files||[];
		module.routes.name = req.params.module;
		res.json(module.routes);
	});
});

module.exports = router;

