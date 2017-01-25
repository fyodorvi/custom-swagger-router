/**
 * Custom swagger router
 */

const runner = require('./swagger-node-runner/index');

module.exports.swaggerRouter = {
    create: (config, requestHandler, securityHandler, documentationProcessor) => {
        return new Promise((resolve, reject) => {
            runner.create(config, (err, runnerInstance) => {
            config.requestHandler = requestHandler;
			config.securityHandler = securityHandler;
            config.documentationProcessor = documentationProcessor;
                if (err) { return reject(err); }
                resolve(runnerInstance.restifyMiddleware());
            });
        });
    }
};
