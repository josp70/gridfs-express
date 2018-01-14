const mongodb = require('mongodb');
const dot = require('dot-object');
const state = require('./state');

function build(req, filename) {
  const bucket = new mongodb.GridFSBucket(state.getDb(), {
    'bucketName': req.query.fs
  });
  const metadata = state.getKeyMetadata(req);
  let keyMetadata = {};

  if (Object.keys(metadata).length > 0) {
    keyMetadata = {metadata};
  }
  // the filter must be in dot notation
  const filter = dot.dot(keyMetadata);

  if (filename) {
    filter.filename = filename;
  }

  const cursor = bucket.find(filter);

  return [
    bucket,
    keyMetadata,
    cursor
  ];
}

exports.build = build;
