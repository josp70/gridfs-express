gridfs-express
=========
[![build status](https://gitlab.com/jorge.suit/gridfs-express/badges/master/build.svg)](https://gitlab.com/jorge.suit/gridfs-express/badges/master/build.svg)

Provide an API REST which support upload/download files to/from a modgodb grid. This package
enable the user to define the API on a given Express router.

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
The function `gridfs` define the following API on the given router object.

| route                     | verb   | URL parameters                   | description                   |
| ------------------------- | ------ | -------------------------------- | ----------------------------- |
| /api/gridfs               | GET    | fs=[string]                      | get all files metadata        |
| /api/gridfs/:id           | GET    | fs=[string]                      | get a single file metadata    |
| /api/gridfs/metadata      | GET    | fs=[string]<br>filename=[string] | get a single file metadata    |
| /api/gridfs/download/:id  | GET    | fs=[string]                      | download a single file        |
| /api/gridfs/download/file | GET    | fs=[string]<br>name=[string]     | download a single file        |
| /api/gridfs               | POST   | fs=[string]                      | upload a new file             |
| /api/gridfs/:id           | DELETE | fs=[string]                      | delete a single file          |
| /api/gridfs/metadata      | DELETE | fs=[string]<br>filename=[string] | delete a single file metadata |
| /api/gridfs/:id           | PATCH  | fs=[string]                      | modify a sigle file metadata  |
| /api/gridfs/metadata      | PATCH  | fs=[string]<br>filename=[string] | modify a single file metadata |

Note that the path `/api/gridfs` depends on the user election.

## Options

The second arguement to the function `gridfs` is an object with options
to conigure the endpoints. It is required to provide a function member
to get the mongodb connection:

```javascript
{
    getDb: () => {return db}
}
```

Other members which are optional are:

* `fsCollections`: it is an array of string which contains the allowed collection
  names to be used in the query parameter `fs`. This array is used to
  validate the query parameter `fs`.
* `getKeyMetadata`: it is a function which should return an object. This
  object will be associated to the file in the gridfs collection. The
  filename will be unique for that object value. This objects is
  stored within the metadata for the file in the gridfs. The function will
  receive as argument the request object `req`. For instance, the following
  function build the key object from the url query parameter id:

```javascript
function getKeyMetadata(req) {
  return {id: req.query.id};
}
```

* `getOtherMetadata`: it is a function which should return an object,
  this object will be stored within the metadata for the file. The function will
  receive as argument the request object `req`.  For instance, the following
  function build the an extra metadata object from the query parameters tag1 and tag2:

```javascript
function getKeyMetadata(req) {
  return {
    tag1: req.query.tag1,
    tag2: req.query.tag1
    };
}
```

  
## http examples

## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing
coding style. Add unit tests for any new or changed
functionality. Lint and test your code.

[![Foo](http://www.google.com.au/images/nav_logo7.png)](http://google.com.au/)