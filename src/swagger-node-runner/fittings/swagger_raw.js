'use strict';

var debug = require('debug')('swagger:swagger_raw');
var YAML = require('js-yaml');
var _ = require('lodash');

// default filter just drops all the x- labels
var DROP_SWAGGER_EXTENSIONS = /^(?!x-.*)/;

// default filter drops anything labeled x-private
var X_PRIVATE = ['x-private'];

module.exports = function create(fittingDef, swagger) {

  debug('config: %j', fittingDef);

  var filter = DROP_SWAGGER_EXTENSIONS;
  if (fittingDef.filter) {
    filter = new RegExp(fittingDef.filter);
  }
  debug('swagger doc filter: %s', filter);
  var privateTags = fittingDef.privateTags || X_PRIVATE;
  var filteredSwagger = filterKeysRecursive(swagger, filter, privateTags);

  if (!filteredSwagger) { return next(null, ''); }

  // should this just be based on accept type?

  return function swagger_raw() {
    return filteredSwagger;
  }
};

function filterKeysRecursive(object, dropTagRegex, privateTags) {
  if (_.isPlainObject(object)) {
    if (_.any(privateTags, function(tag) { return object[tag]; })) {
      object = undefined;
    } else {
      var result = {};
      _.each(object, function(value, key) {
        if (dropTagRegex.test(key)) {
          var v = filterKeysRecursive(value, dropTagRegex, privateTags);
          if (v !== undefined) {
            result[key] = v;
          } else {
            debug('dropping object at %s', key);
            delete(result[key]);
          }
        }
      });
      return result;
    }
  }
  return object;
}
