const utils = require('./utils');
const {HTTP400} = require('./constants');

exports.middleware = (req, res, next) => {
  if (!utils.isValue(req.query.filename)) {
    return res.status(HTTP400).json({
      success: false,
      message: 'missing filename query parameter'
    });
  }
  return next();
};
