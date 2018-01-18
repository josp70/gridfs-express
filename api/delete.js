const gridBucket = require('./bucket');
const paramFs = require('./param-fs');
const paramFilename = require('./param-filename');
const apiUtil = require('./utils');
const {HTTP404, HTTP500} = require('./constants');

function define(router) {
  router.delete('/delete', paramFs.middleware, paramFilename.middleware, (req, res) => {
    const [
      bucket,
      keyMetadata,
      cursor
    ] = gridBucket.build(req, req.query.filename);

    return cursor.next().then((doc) => {
      if (doc === null) {
        return res.status(HTTP404).json(Object.assign({
          success: false,
          message: 'file not found',
          filename: req.query.filename
        }, keyMetadata));
      }
      return bucket.delete(doc._id, (err) => {
        if (apiUtil.isValue(err)) {
          res.status(HTTP500).json({
            success: false,
            filename: req.query.filename,
            error: err
          });
        } else {
          res.json(Object.assign({
            success: true,
            filename: req.query.filename
          }, keyMetadata));
        }
      });
    });
  });
}

exports.define = define;
