const paramFs = require('./param-fs');
const gridBucket = require('./bucket');

function get(router) {
  router.get('/list', paramFs.middleware, (req, res) => {
    const [, , cursor] = gridBucket.build(req);

    return cursor.toArray().then((documents) => {
      res.json({
        success: true,
        files: documents
      });
    });
  });
}

exports.get = get;
