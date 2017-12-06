/* eslint no-process-env: "off" */
/* global describe, it, after, before */

const chakram = require('chakram');
const {expect} = chakram;
const fs = require('fs');
const path = require('path');

process.env.NODE_ENV = 'test';

const service = require('./fixture/service');
const HTTP200 = 200;
const HTTP403 = 403;
const HTTP404 = 404;

describe('USER-AUTH-JSONRPC', () => {
  let url = '';

  before('start server', (done) => {
    service.start();
    service.app.on('ready', () => {
      url = service.getEndPoint();
      done();
    });
  });

  describe('WRONG METHODS', () => {
    it('return 404 on POST /api/gridfs', () => {
      const response = chakram.post(url);

      expect(response).to.have.status(HTTP404);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 404 on GET /api/gridfs', () => {
      const response = chakram.get(url);

      expect(response).to.have.status(HTTP404);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  describe('UPLOAD', () => {

    it('return 403 on POST /api/gridfs/upload?fs=unknown', () => {
      const response = chakram.post(`${url}/upload?fs=unknown`);

      expect(response).to.have.status(HTTP403);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 404 on GET /api/gridfs/upload', () => {
      const response = chakram.get(`${url}/upload`);

      expect(response).to.have.status(HTTP404);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 200 on POST /api/gridfs/upload with no file', () => {
      const response = chakram.post(`${url}/upload`);

      expect(response).to.have.status(HTTP200);
      expect(response)
      .to.comprise
      .json({
        success: true,
        uploaded: []
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 200 on POST /api/gridfs/upload with multiform', () => {
      const file = path.resolve(__dirname, './fixture/data/sample_file.txt');

      /* eslint no-void: 0 */
      const response = chakram.post(`${url}/upload`, void 0, {
        formData: {file: fs.createReadStream(file)},
        headers: {'Content-Type': 'multipart/form-data'}
      });

      /*
      expect(response).to.have.status(HTTP200);
      expect(response)
      .to.comprise
      .json({
        success: true,
        uploaded: []
      });*/
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();

    });
  });

  describe('DOWNLOAD', () => {
    it('return 403 on GET /api/gridfs/download?fs=unknown', () => {
      const response = chakram.get(`${url}/download?fs=unknown`);

      expect(response).to.have.status(HTTP403);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 404 on POST /api/gridfs/download', () => {
      const response = chakram.post(`${url}/download`);

      expect(response).to.have.status(HTTP404);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 404 on GET /api/gridfs/download no filename query', () => {
      const response = chakram.get(`${url}/download`);

      expect(response).to.have.status(HTTP403);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 200 & success on GET /api/gridfs/download no filename query', () => {
      const response = chakram.get(`${url}/download?filename=sample_file.txt`);

      expect(response).to.have.status(HTTP200);
      // expect(response).to.equal('hola');

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait().then(() => {
        expect(response.valueOf().body).to.equal('hello gridfs');
      });
    });
  });

  after('stop service', (done) => {
    service.close();
    done();
  });
});
