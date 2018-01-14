const fs = require('fs');
const mongodb = require('mongodb');
const gridBucket = require('./bucket');
const {ObjectID} = mongodb;
const state = require('./state');
const formidable = require('formidable');
const paramFs = require('./param-fs');

function gridfsInsert(req, file) {
  const [
    bucket,
    keyMetadata,
    cursor
  ] = gridBucket.build(req, file.name);

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
    const otherMetadata = state.getOtherMetadata(req);
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

function post(router) {
  router.post('/upload', paramFs.middleware, (req, res) => {

    // create an incoming form object
    const form = new formidable.IncomingForm();

    // store all uploads in the /uploads directory
    form.uploadDir = state.dirUploads;

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
}

exports.post = post;
