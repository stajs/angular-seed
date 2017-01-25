import * as express from 'express';
import * as fallback from 'express-history-api-fallback';
import * as openResource from 'open';
import { resolve } from 'path';
import * as http from 'http';
import * as socketIo from 'socket.io';

import * as codeChangeTool from './code_change_tools';
import Config from '../../config';

/**
 * Serves the Single Page Application. More specifically, calls the `listen` method, which itself launches BrowserSync.
 */
export function serveSPA() {
  codeChangeTool.listen();
}

/**
 * This utility method is used to notify that a file change has happened and subsequently calls the `changed` method,
 * which itself initiates a BrowserSync reload.
 * @param {any} e - The file that has changed.
 */
export function notifyLiveReload(e:any) {
  let fileName = e.path;
  codeChangeTool.changed(fileName);
}

/**
 * Starts a new `express` server, serving the static documentation files.
 */
export function serveDocs() {
  let server = express();

  server.use(
    Config.APP_BASE,
    express.static(resolve(process.cwd(), Config.DOCS_DEST))
  );

  server.listen(Config.DOCS_PORT, () =>
    openResource('http://localhost:' + Config.DOCS_PORT + Config.APP_BASE)
  );
}

/**
 * Starts a new `express` server, serving the static unit test code coverage report.
 */
export function serveCoverage() {
  let server = express();

  server.use(
    Config.APP_BASE,
    express.static(resolve(process.cwd(), Config.COVERAGE_TS_DIR))
  );

  server.listen(Config.COVERAGE_PORT, () =>
    openResource('http://localhost:' + Config.COVERAGE_PORT + Config.APP_BASE)
  );
}

/**
 * Starts a new `express` server, serving the built files from `dist/prod`.
 */
export function serveProd() {
  let root = resolve(process.cwd(), Config.PROD_DEST);
  let server = express();

  for (let proxy of Config.getProxyMiddleware()) {
    server.use(proxy);
  }

  server.use(Config.APP_BASE, express.static(root));

  server.use(fallback('index.html', { root }));

  server.listen(Config.PORT, () =>
    openResource('http://localhost:' + Config.PORT + Config.APP_BASE)
  );
  
  let httpServer = http.createServer();
  httpServer.listen(9090);
  let io = socketIo(httpServer);

  console.log('httpServer: ' + httpServer);
  console.log('io: ' + io);

  io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data: any) {
      console.log('my other event', data);
    });

    socket.on('update', function (data: any) {
      console.log('update', data);
      socket.broadcast.emit('update', {doIt: true});
    });
  });
};
