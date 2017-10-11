const express = require('express');
const mongodb = require('mongodb');
const app = express();

const gridfs = require('./index');

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
