/* eslint no-process-env: "off" */
/* global describe, it, after, before */

const chakram = require('chakram');
const {expect} = chakram;
const fs = require('fs');
const path = require('path');
const {HTTP200, HTTP400, HTTP404} = require('../api/constants');

process.env.NODE_ENV = 'test';

const service = require('./fixture/service');

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

    it('return 400 on POST /api/gridfs/upload?fs=unknown', () => {
      const response = chakram.post(`${url}/upload?fs=unknown`);

      expect(response).to.have.status(HTTP400);
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
      const response = chakram.post(`${url}/upload?fs=input&id=myid&tag=mytag`);

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
      const response = chakram.post(`${url}/upload?fs=input&id=myid&tag=mytag`, void 0, {
        formData: {file: fs.createReadStream(file)},
        headers: {'Content-Type': 'multipart/form-data'}
      });

      expect(response).to.have.status(HTTP200);
      expect(response)
      .to.comprise
      .json({
        success: true,
        uploaded: {
          filename: 'sample_file.txt'
        }
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();

    });

    it('return 200 on POST the same file repeated', () => {
      const file = path.resolve(__dirname, './fixture/data/sample_file.txt');

      /* eslint no-void: 0 */
      const response = chakram.post(`${url}/upload?fs=input&id=myid&tag=mytag`, void 0, {
        formData: {
          file1: fs.createReadStream(file),
          file2: fs.createReadStream(file)
        },
        headers: {'Content-Type': 'multipart/form-data'}
      });

      expect(response).to.have.status(HTTP200);
      expect(response)
      .to.comprise
      .json({
        success: true,
        uploaded: {
          filename: 'sample_file.txt'
        }
      });
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();

    });
  });

  describe('DOWNLOAD', () => {
    it('return 400 on GET /api/gridfs/download?fs=unknown', () => {
      const response = chakram.get(`${url}/download?fs=unknown&id=myid`);

      expect(response).to.have.status(HTTP400);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 404 on POST /api/gridfs/download', () => {
      const response = chakram.post(`${url}/download?fs=input&id=myid`);

      expect(response).to.have.status(HTTP404);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 400 on GET /api/gridfs/download no filename query', () => {
      const response = chakram.get(`${url}/download?fs=input&id=myid`);

      expect(response).to.have.status(HTTP400);
      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 404 on GET and key not found', () => {
      const response = chakram.get(`${url}/download?fs=input&filename=sample_file.txt&id=badid`);

      expect(response).to.have.status(HTTP404);

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });

    it('return 200 & success on GET /api/gridfs/download', () => {
      const response = chakram.get(`${url}/download?fs=input&filename=sample_file.txt&id=myid`);

      expect(response).to.have.status(HTTP200);

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait().then(() => {
        expect(response.valueOf().body).to.equal('hello gridfs');
      });
    });
  });

  describe('LIST', () => {
    it('return 200 on GET /api/gridfs/list', () => {
      const response = chakram.get(`${url}/list?fs=input&id=myid`);

      expect(response).to.have.status(HTTP200);
      after(() => {
        // console.log(JSON.stringify(response.valueOf().body, null, '  '));
      });
      return chakram.wait().then(() => {
        const {body} = response.valueOf();

        // console.log(body);
        expect(body).to.have.keys([
          'success',
          'files'
        ]);
        expect(body.files).to.be.a('array');
      });
    });
  });

  describe('DELETE', () => {
    it('return 200 & success on DELETE /api/gridfs/delete', () => {
      const response = chakram.delete(`${url}/delete?fs=input&filename=sample_file.txt&id=myid`);

      expect(response).to.have.status(HTTP200);

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
    it('return 404 & success on DELETE /api/gridfs/delete (just deleted)', () => {
      const response = chakram.delete(`${url}/delete?fs=input&filename=sample_file.txt&id=myid`);

      expect(response).to.have.status(HTTP404);

      after(() => {
        // console.log(response.valueOf().body);
      });
      return chakram.wait();
    });
  });

  after('stop service', (done) => {
    service.close();
    done();
  });
});
