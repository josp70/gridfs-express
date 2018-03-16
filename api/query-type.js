const utils = require('./utils');
const Boom = require('boom');

exports.middleware = (req, res, next) => {
  if (!utils.isValue(req.query.type)) {
    req.query.type = 'data';
    return next();
  }
  const validTypes = [
    'data',
    'info'
  ];

  if (validTypes.includes(req.query.type)) {
    return next();
  }
  return next(Boom.badRequest(`Invalid query parameter type=${req.query.type}`, {validTypes}));
};
