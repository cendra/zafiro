'use strict';

var _ = require('lodash');
var Zafiro = require('./zafiro.model');

// Get list of zafiros
exports.index = function(req, res) {
  Zafiro.find(function (err, zafiros) {
    if(err) { return handleError(res, err); }
    return res.json(200, zafiros);
  });
};

// Get a single zafiro
exports.show = function(req, res) {
  Zafiro.findById(req.params.id, function (err, zafiro) {
    if(err) { return handleError(res, err); }
    if(!zafiro) { return res.send(404); }
    return res.json(zafiro);
  });
};

// Creates a new zafiro in the DB.
exports.create = function(req, res) {
  Zafiro.create(req.body, function(err, zafiro) {
    if(err) { return handleError(res, err); }
    return res.json(201, zafiro);
  });
};

// Updates an existing zafiro in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Zafiro.findById(req.params.id, function (err, zafiro) {
    if (err) { return handleError(res, err); }
    if(!zafiro) { return res.send(404); }
    var updated = _.merge(zafiro, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, zafiro);
    });
  });
};

// Deletes a zafiro from the DB.
exports.destroy = function(req, res) {
  Zafiro.findById(req.params.id, function (err, zafiro) {
    if(err) { return handleError(res, err); }
    if(!zafiro) { return res.send(404); }
    zafiro.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}