const utils = require('./utils');
const state = require('./state');

const HTTP403 = 403;

exports.middleware = (req, res, next) => {
  if (!utils.isValue(req.query.fs)) {
    if (state.fsCollections.length === 1) {

      [req.query.fs] = state.fsCollections;
    } else {
      return res.status(HTTP403).json({
        success: false,
        message: `missing query parameter fs, must take one of the values ${state.fsCollections}`
      });
    }
  }
  if (state.fsCollections.includes(req.query.fs)) {
    return next();
  }
  return res.status(HTTP403).json({
      success: false,
      message: `invalid query parameter fs=${req.query.fs} must be one of ${state.fsCollections}`
    });
};
