'use strict';

module.exports = init;

var debug = require('debug')('swagger:restify_middleware');
var restify = require('restify');
var ALL_METHODS = ['del', 'get', 'head', 'opts', 'post', 'put', 'patch'];

function init(runner) {
  return new Middleware(runner);
}

function Middleware(runner) {

  this.runner = runner;

  var connectMiddleware = runner.connectMiddleware();
  var chain = connectMiddleware.middleware();

  this.register = function register(app) {

    // this bit of oddness forces Restify to route all requests through the middleware
    ALL_METHODS.forEach(function(method) {
      app[method]('.*', function(req, res, next) {
        req.query = undefined; // oddly, req.query is a function in Restify, kill it
        chain(req, res, function(err) {
          if (err) { return next(err); }
          if (!res.finished) {
			next(new restify.NotFoundError());
          } else {
          	next();
		  }
        });
      });
    });

    connectMiddleware.register(app);
  };
}
