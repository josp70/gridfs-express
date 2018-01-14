const gridBucket = require('./bucket');
const utils = require('./utils');
const paramFs = require('./param-fs');

const HTTP403 = 403;
const HTTP404 = 404;

function get(router) {
  router.get('/download', paramFs.middleware, (req, res) => {
    if (!utils.isValue(req.query.filename)) {
      return res.status(HTTP403).json({
        success: false,
        message: 'missing filename query parameter'
      });
    }

    const [
      bucket,
      keyMetadata,
      cursor
    ] = gridBucket.build(req, req.query.filename);

    return cursor.next().then((doc) => {
      if (doc === null) {
        return res.status(HTTP404).json({
          success: false,
          message: `file '${req.query.filename}' not found`,
          data: keyMetadata
        });
      }
      res.set('Content-Disposition', `attachment; filename=${req.query.filename}`);

      /** set the proper content type */
      res.set('Content-Type', 'application/octet-stream');

      /** return response */
      return bucket.openDownloadStream(doc._id).pipe(res);
    });
  });
}

exports.get = get;
