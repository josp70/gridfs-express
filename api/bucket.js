const {GridFSBucket, ObjectId} = require('mongodb');
const dot = require('dot-object');
const state = require('./state');

function build(req, id) {
  const bucket = new GridFSBucket(state.getDb(), {
    'bucketName': req.query.fs
  });
  const metadata = state.getKeyMetadata(req);
  let keyMetadata = {};

  if (Object.keys(metadata).length > 0) {
    keyMetadata = {metadata};
  }
  // the filter must be in dot notation
  const filter = dot.dot(keyMetadata);

  if (id) {
    if (id._id) {
      filter._id = new ObjectId(id._id);
    } else if (id.filename) {
      filter.filename = id.filename;
    }
  }

  const cursor = bucket.find(filter);

  return [
    bucket,
    keyMetadata,
    cursor
  ];
}

exports.build = build;
