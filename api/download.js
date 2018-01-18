const gridBucket = require('./bucket');
const paramFs = require('./param-fs');
const paramFilename = require('./param-filename');

const {HTTP404} = require('./constants');

function define(router) {
  router.get('/download', paramFs.middleware, paramFilename.middleware, (req, res) => {
    const [
      bucket,
      keyMetadata,
      cursor
    ] = gridBucket.build(req, req.query.filename);

    return cursor.next().then((doc) => {
      if (doc === null) {
        return res.status(HTTP404).json(Object.assign({
          success: false,
          message: 'file  not found',
          filename: req.query.filename
        }, keyMetadata));
      }
      res.set('Content-Disposition', `attachment; filename=${req.query.filename}`);

      /** set the proper content type */
      res.set('Content-Type', 'application/octet-stream');

      /** return response */
      return bucket.openDownloadStream(doc._id).pipe(res);
    });
  });
}

exports.define = define;
