const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const app = express();


const expressListRoutes = require('express-list-routes');

const gridfs = require('../../index');

const dburl = process.env.MONGO_URL || 'mongodb://localhost:27017/gridfs_fixture';

let db = null;

const routerAPI = new express.Router();

gridfs(routerAPI, {
  getDb: () => db,
  getKeyMetadata: (req) => ({id: req.query.id}),
  getOtherMetadata: (req) => req.body,
  fsCollections: [
    'input',
    'output'
  ]
});

app.use(bodyParser.json());

/*
app.use((req, res, next) => {
  console.log('[BODY] --', req.body);
  next();
});
*/

app.use('/api/gridfs', routerAPI);

let server = null;

exports.app = app;

exports.getEndPoint = () => `http://localhost:${server.address().port}/api/gridfs`;

exports.start = () => mongodb.MongoClient.connect(dburl)
  .then((database) => {
    db = database;
    server = app.listen(0, () => {
      console.log(`server listen on ${server.address().port}`);
      expressListRoutes({prefix: '/api/gridfs'}, 'API:', routerAPI);
      app.emit('ready', null);
    });
    exports.server = server;
  });

exports.close = () => {
  db.close()
  .then(() => {
    server.close();
  });
};

/* eslint no-process-env: "off" */
if (process.env.NODE_ENV !== 'test') {
  exports.start();
}
