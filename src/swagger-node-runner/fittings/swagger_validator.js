'use strict';

var debug = require('debug')('swagger:swagger_validator');
var _ = require('lodash');
var util = require('util');
var path = require('path');
var restify = require('restify');
var SWAGGER_ROUTER_CONTROLLER = 'x-swagger-router-controller';

module.exports = function create(fittingDef, bagpipes) {

	debug('config: %j', fittingDef);

	var swaggerNodeRunner = bagpipes.config.swaggerNodeRunner;

	return function swagger_validator(context, cb) {

		debug('exec');

		// todo: add support for validating accept header against produces declarations
		// see: http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
		//var accept = req.headers['accept'];
		//var produces = _.union(operation.api.definition.produces, operation.definition.produces);

		var operation = context.request.swagger.operation;
		var operationId = operation.definition['operationId'] || context.request.method.toLowerCase();

		let controller;

		try {
            controller = swaggerNodeRunner.config.swagger.controllers[SWAGGER_ROUTER_CONTROLLER] || swaggerNodeRunner.config.swagger.controllers['_default_controller_'];
            context.request.context.methodName = operationId;
            context.request.context.className = controller.constructor.name;
		} catch (error) {
			console.log(error);
		}

		if (!controller) {
			var controllerName = operation[SWAGGER_ROUTER_CONTROLLER] || operation.pathObject[SWAGGER_ROUTER_CONTROLLER] || swaggerNodeRunner.config.swagger.defaultController;
			var controllerPath = path.resolve('./controllers/', controllerName);
			controller = require(controllerPath);
			context.request.context.methodName = operationId;
			context.request.context.className = controller['_className'] || controllerName;
        }

		if (controller.metricsConfig) {
			context.request.metricsConfig = controller.metricsConfig[operationId];
		}
		if (typeof swaggerNodeRunner.config.swagger.requestHandler == 'function') {
			swaggerNodeRunner.config.swagger.requestHandler(context.request, context.response);
		}

		const continueValidation  = function () {
			var validateResult = operation.validateRequest(context.request);
			if (validateResult.errors.length > 0) {
				var error = new restify.BadRequestError('Validation errors');
				error.body.errors = validateResult.errors;
			}

			cb(error);
		};

		if (context.request.context) {
			let requestOptions;

			if (controller._secureLog && controller._secureLog[operationId]) {
				requestOptions = { secureLog: true }
			}

			let documentation;

			if (controller._xDocumentation && controller._xDocumentation[operationId]) {
				documentation = controller._xDocumentation[operationId];
			}

			if (swaggerNodeRunner.config.swagger.documentationProcessor) {
            	swaggerNodeRunner.config.swagger.documentationProcessor.processMethod(context.request.context, operationId, documentation);
            }

			context.request.context.logRequest(requestOptions);
		}

		if (typeof swaggerNodeRunner.config.swagger.securityHandler == 'function') {

			let requiredRoles = [];

			if (controller._securityRoles) {
				requiredRoles = controller._securityRoles[operationId] || controller._securityRoles['_default'] || [];
			}

			swaggerNodeRunner.config.swagger.securityHandler(context.request.context, requiredRoles, (error) => {
				if (error !== undefined) {
					cb(error);
				} else {
					continueValidation();
				}
			});
		} else {
			continueValidation();
		}


	}
};
