'use strict';

var express = require('express');
//var controller = require('./zafiro.controller');
var fs = require('fs');
var url = require('url');
var path = require('path');
var async = require('async');
var config = require('../../config/environment');
var appsPath = path.join(config.root, 'apps');
var extend = require('extend');
var request = require('request');
var oauth = require('simple-oauth2')(config.oauth);

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
	async.auto({
		id: function(cb) {
			var step = config.auth;
			if(step.rest) {
				request.post({url: step.rest, form: req.body}, function(err, response, body) {
					try {
						var body = JSON.parse(body);
					} catch(e) {
						console.log(body);
						console.log(err);
					}
					if(err || response.statusCode != 200) {
						return cb({status: response.statusCode||500, msg: body});
					} else {
						return cb(null, body.id);
					}
					
				});
			} else {
				cb({status: 500, msg: 'No user id found.'});
			}
		},
		oauth: ['id', function(cb, user) {
			oauth.client.getToken({scope: ['openid', 'profile']}, function(err, result) {
				return cb(err, result&&oauth.accessToken.create(result));
			});
		}],
		info: ['oauth', function(cb, user) {
			var step = config.user.info
			if(step.rest) {
				var infoUrl = url.parse(step.rest.replace(/:id:/g, user.id));
				infoUrl.query=infoUrl.query||{};
				infoUrl.query.access_token = user.oauth.token.access_token;
				request.get(url.format(infoUrl), function(err, response, body) {
					if(err) {
						return cb({status: response.statusCode||500, msg: body});
					} else {
						return cb(null, body);
					}
				});
			}
		}],
		roles: ['oauth', function(cb, user) {
			var step = config.user.roles
			if(step.rest) {
				var rolesUrl = url.parse(step.rest.replace(/:id:/g, user.id));
				rolesUrl.query=rolesUrl.query||{};
				rolesUrl.query.access_token = user.oauth.token.access_token;
				request.get(url.format(rolesUrl), function(err, response, body) {
					if(err) {
						return cb({status: response.statusCode, msg: body});
					} else {
						return cb(null, body);
					}
				});
			}
		}]
	}, 	function(err, results) {
		if(err) {
			return res.status(err.status||500).json(err.msg);
		}
		req.session.user = results;
		res.json(results.info);
	});
	
});

module.exports = router;

