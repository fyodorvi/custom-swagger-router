/**
 * Custom swagger router
 */

const runner = require('./swagger-node-runner/index');

export const swaggerRouter = {
    create: (config, requestHandler, securityHandler, documentationProcessor) => {
        return new Promise((resolve, reject) => {
            runner.create(config, (err, runnerInstance) => {
            config.requestHandler = requestHandler;
			config.securityHandler = securityHandler;
			confif.documentationProcessor = documentationProcessor;
                if (err) { return reject(err); }
                resolve(runnerInstance.restifyMiddleware());
            });
        });
    }
};
