const Boom = require('boom');

/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "next" }] */
function errorHandler (err, req, res, next) {
  let bError = null;

  if (err.isBoom) {
    bError = err;
  } else {
    bError = Boom.badImplementation(err.message, {
      errCode: err.code,
      errMessage: err.message
    });
  }

  const body = err.output.payload;

  if (bError.data) {
      body.data = err.data;
  }
  res.status(bError.output.statusCode).json(body);
}

function define(router) {
  router.use(errorHandler);
}

exports.define = define;
