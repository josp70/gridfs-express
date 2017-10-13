const tmp = require('tmp');
const dot = require('dot-object');
const formidable = require('formidable');
const mongodb = require('mongodb');
const fs = require('fs');
const path = require('path');
const ObjectID = mongodb.ObjectID;

function defaultGetKeyMetadata() {
    return {};
}

function defaultGetOtherMetadata() {
    return {};
}

let config = {};

function createTempDir() {
    const tmpobj = tmp.dirSync({ template: '/tmp/gridfs-XXXXXX' });
    config.dirUploads = tmpobj.name;
};

function buildBucket(req, filename) {
    const bucket = new mongodb.GridFSBucket(config.getDb(), {
	"bucketName": req.query.fs
    });
    const metadata = config.getKeyMetadata(req);
    const keyMetadata = Object.keys(metadata).length > 0 ? {
	metadata: config.getKeyMetadata(req)
    } : {};
    const filter = Object.assign(dot.dot(keyMetadata), {
	"filename": filename
    });
    const cursor = bucket.find(filter);
    return [bucket, keyMetadata, cursor];
};

module.exports = function(router, options) {
    if(options == null || (typeof options.getDb !== 'function')) {
	throw new Error('options.' + key + ' is undefined or null');
    }
    if (typeof options.getDb === 'function') {
	config.getDb = options.getDb;
    } else {
	throw new Error('options.getDb must be a function');
    }
    const fsOptions = options.fsCollections || ['fs'];
    if (typeof fsOptions === 'string') {
	config.fsCollections = [fsOptions]
    } else if (Array.isArray(fsOptions)) {
	config.fsCollections = fsOptions;
    } else {
	throw new Error('bad config property db.fs = ' + fsOptions + ". Must be a string or an Array.");
    }
    config.fsCollections.forEach((x) => {
	if(typeof(x) !== 'string') {
	    throw new Error('Invalid member ' + x + ' options.fsCollection, must be a string');
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
    
    router.use(function(req, res, next) {
	if(req.query.fs == null) {
	    if( config.fsCollections.length===1 ) {
		req.query.fs = config.fsCollections[0];
	    } else {
		return res.status(403).json({
		    success: false,
		    message: 'missing query parameter fs, must take one of the values ' +
			config.fsCollections
		});
	    }
	}
	if (config.fsCollections.includes(req.query.fs)) {
            next();
	} else {
            return res.status(403).json({
		success: false,
		message: 'invalid query parameter fs=' + req.query.fs + ' must be one of ' +
		    config.fsCollections
            });
	}
    });

    router.post('/upload', function(req, res) {

	// create an incoming form object
	const form = new formidable.IncomingForm();

	// store all uploads in the /uploads directory
	form.uploadDir = config.dirUploads;

	let fileUploaded = [];

	// every time a file has been uploaded successfully,
	// stream it to gridfs
	form.on('file', async function(field, file) {
            //Fs.rename(file.path, Path.join(form.uploadDir, file.name));
            fileUploaded.push(file.name);
	    const [bucket, keyMetadata, cursor] = buildBucket(req, file.name);
	    
            let id;
            if(await cursor.hasNext()) {
		const doc = await cursor.next();
		id = doc._id;
		await bucket.delete(id);
		while(await cursor.hasNext()) {
                    const doc = await cursor.next();
                    id = doc._id;
                    await bucket.delete(id);
		}
            } else {
		id = ObjectID();
            }
	    const otherMetadata = config.getOtherMetadata(req);
	    const fullMetadata = Object.assign({}, otherMetadata, keyMetadata.metadata);
            fs.createReadStream(file.path).
		pipe(bucket.openUploadStreamWithId(id, file.name, fullMetadata)).on('error', function(error) {
		    fs.unlink(file.path, function (err) {
			if(err) {
			    console.log("error while piping => fs.unlink ");
			} else {
			}
		    });
		}).on('finish', function() {
		    fs.unlink(file.path, function (err) {
			if(err) {
			    console.log("error on pipe finished => fs.unlink ");
			} else {
			}
		    });
		});
	});
	
	// log any errors that occur
	form.on('error', function(err) {
	    console.log('An error has occured: \n' + err);
	});
	
	// once all the files have been uploaded, send a response to the client
	form.on('end', function() {
	    res.json({
		success: true,
		uploaded: fileUploaded
	    });
	});
	
	// parse the incoming request containing the form data
	form.parse(req);
    });

    router.get('/download', async function(req, res) {
	if(req.query.filename == null) {
            return res.status(404).json({
		success: false,
		message: 'missing filename query parameter'
            });
	}
	const [bucket, keyMetadata, cursor] = buildBucket(req, req.query.filename);
	
	if(await cursor.hasNext()) {
            const doc = await cursor.next();
	    
            res.set('Content-Disposition', 'attachment; filename='+req.query.filename);
	    
            /** set the proper content type */
            res.set('Content-Type', "application/octet-stream");
	    
            /** return response */
            await bucket.openDownloadStream(doc._id).pipe(res);
	} else {
            res.status(404).json({
		success: false,
		message: "file '" + req.query.filename + "' not found",
		data: keyMetadata
            });
	}
    });
};








