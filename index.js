const tmp = require('tmp');
const dot = require('dot-object');
const formidable = require('formidable');
const mongodb = require('mongodb');
const fs = require('fs');
const {ObjectID} = mongodb;

const HTTP403 = 403;
const HTTP404 = 404;

const isValue = (value) => typeof value !== 'undefined' && value !== null;

function defaultGetKeyMetadata() {
  return {};
}

function defaultGetOtherMetadata() {
  return {};
}

const config = {};

function createTempDir() {
  tmp.dir({template: '/tmp/gridfs-XXXXXX'}, (err, path, ignored) => {
    if (err) {
      console.log(err);
    } else {
      config.dirUploads = path;
      console.log(`temporary dir created: ${path}`);
    }
  });
}

function buildBucket(req, filename) {
  const bucket = new mongodb.GridFSBucket(config.getDb(), {
    'bucketName': req.query.fs
  });
  const metadata = config.getKeyMetadata(req);
  let keyMetadata = {};

  if (Object.keys(metadata).length > 0) {
    keyMetadata = {metadata};
  }
  const filter = Object.assign(dot.dot(keyMetadata), {filename});
  const cursor = bucket.find(filter);

  return [
    bucket,
    keyMetadata,
    cursor
  ];
}

const mwFS = (req, res, next) => {
  if (!isValue(req.query.fs)) {
    if (config.fsCollections.length === 1) {

      [req.query.fs] = config.fsCollections;
    } else {
      return res.status(HTTP403).json({
        success: false,
        message: `missing query parameter fs, must take one of the values ${config.fsCollections}`
      });
    }
  }
  if (config.fsCollections.includes(req.query.fs)) {
    return next();
  }
  return res.status(HTTP403).json({
      success: false,
      message: `invalid query parameter fs=${req.query.fs} must be one of ${config.fsCollections}`
    });
};

function gridfsInsert(req, file) {
  const [
    bucket,
    keyMetadata,
    cursor
  ] = buildBucket(req, file.name);

  return cursor.toArray().then((docs) => {
    if (docs.length > 0) {
      return Promise.all(
        docs.map((doc) => bucket.delete(doc._id).then(() => doc._id))
      );
    }
    return Promise.resolve([new ObjectID()]);
  })
  .then((idDocs) => {
    const [id] = idDocs;
    const otherMetadata = config.getOtherMetadata(req);
    const metadata = Object.assign({}, otherMetadata, keyMetadata.metadata);

    return new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
      .pipe(bucket.openUploadStreamWithId(id, file.name, {metadata}))
      .on('error', (errorPipe) => {
        console.log(errorPipe);
        fs.unlink(file.path, (err) => {
          if (err) {
            console.log('error while piping => fs.unlink ');
          }
          reject(errorPipe);
        });
      })
      .on('finish', () => {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.log('error on pipe finished => fs.unlink ');
          }
          resolve(file.name);
        });
      });
    });
  });
}

module.exports = (router, options) => {
  if (!isValue(options) || !isValue(options.getDb)) {
    throw new Error('options.getDb is undefined or null');
  }

  if (typeof options.getDb === 'function') {
    config.getDb = options.getDb;
  } else {
    throw new Error('options.getDb must be a function');
  }

  const fsOptions = options.fsCollections || ['fs'];

  if (typeof fsOptions === 'string') {
    config.fsCollections = [fsOptions];
  } else if (Array.isArray(fsOptions)) {
    config.fsCollections = fsOptions;
  } else {
    throw new Error(`bad config property db.fs = ${fsOptions}. Must be a string or an Array.`);
  }

  config.fsCollections.forEach((fsName) => {
    if (typeof fsName !== 'string') {
      throw new Error(`Invalid member ${fsName} options.fsCollection, must be a string`);
    }
  });

  config.getKeyMetadata = options.getKeyMetadata || defaultGetKeyMetadata;
  if (typeof config.getKeyMetadata !== 'function') {
    throw new Error('options.getKeyMetadata must be a function');
  }

  config.getOtherMetadata = options.getOtherMetadata || defaultGetOtherMetadata;
  if (typeof config.getOtherMetadata !== 'function') {
    throw new Error('options.getOtherMetadata must be a function');
  }

  createTempDir();

  router.post('/upload', mwFS, (req, res) => {

    // create an incoming form object
    const form = new formidable.IncomingForm();

    // store all uploads in the /uploads directory
    form.uploadDir = config.dirUploads;

    const filesReceived = [];
    const filesUploaded = [];

    /* every time a file has been uploaded successfully,
     stream it to gridfs */
    form.on('file', (field, file) => {
      // Fs.rename(file.path, Path.join(form.uploadDir, file.name));
      if (filesReceived.includes(file.name)) {
        console.log(`file already provided: ${file.name}`);
      } else {
        filesReceived.push(file.name);
        const promiseInsert = gridfsInsert(req, file);

        filesUploaded.push(promiseInsert);
      }
    });

    // log any errors that occur
    form.on('error', (err) => {
      console.log(`An error has occured: \n' + ${err}`);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', () => {
      Promise.all(filesUploaded)
      .then(() => res.json({
        success: true,
        uploaded: filesReceived
      }));
    });

    // parse the incoming request containing the form data
    form.parse(req);
  });

  router.get('/download', mwFS, (req, res) => {
    if (!isValue(req.query.filename)) {
      return res.status(HTTP403).json({
        success: false,
        message: 'missing filename query parameter'
      });
    }

    const [
      bucket,
      keyMetadata,
      cursor
    ] = buildBucket(req, req.query.filename);

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
};
