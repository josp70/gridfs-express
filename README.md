gridfs-express
=========

Module to configure an express router in order to upload/download
files to/from a modgodb grid.

## Installation

  `npm install jsonrpc2-express`

## Usage

```javascript
const express = require('express');
const mongodb = require('mongodb');

const app = express();

const gridfs = require('gridfs-express');

const url = "mongodb://localhost:27017/gridfs_test";

let db;

mongodb.MongoClient.connect(url, function(err, database) {
    if(err) throw err;

    db = database;
    // Start the application after the database connection is ready
    app.listen(3000);
    console.log("Listening on port 3000");
});

const routerAPI = express.Router();

gridfs(routerAPI, {
    getDb: () => {return db}
});

app.use('/api/gridfs', routerAPI);
```

When we invoke `gridfs` on an express router two endpoint are defined
for that router:

* POST /upload: the attached files are uploaded to the gridfs. It is
  possible to specify a collection name in the query parameter `fs`
  and a key fields to used when inserting the file, this allow to
  upload the same filename if different keys are provided.

* GET /download retrieve the file given the query parameters
  `filename` and `fs`. 
  
It is up to the service to compute a key object to diffentiate files
with the same name, this can be normally compute form the request
(query parameters or JWT)

## Options

The second arguemtn to the function `gridfs` is an object with options
to conigure the endpoints. It is required to provide a function member
to get the mongodb connection:

```javascript
{
    getDb: () => {return db}
}
```

Other members which are optional are:

* `fsCollection`: it is and array of string with allowed collection
  names to be used in the query parameter `fs`. This array is used to
  validate the query paramet `fs`.
* `getKeyMetadata`: it is a function which should return object. This
  object will be associated to the file in the collection. The
  filename will be unique for that object value. This objects is
  stored within the metadata for the file.
* `getOtherMetadata`: it is a function which should return an object,
  this object will be stored within the metadata for the file.

## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing
coding style. Add unit tests for any new or changed
functionality. Lint and test your code.
