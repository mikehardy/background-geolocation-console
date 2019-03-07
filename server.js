import initializeDatabase from './src/server/database/initializeDatabase';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import compress from 'compression';
import 'colors';
import opn from 'opn';
import request from 'request';
let app = express();

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 9000;
const sslPort = process.env.SSLPORT || 9443;
const domainName = process.env.DOMAINNAME || 'localhost';
const adminEmail = process.env.ADMINEMAIL || 'example@example.com';

const baseURL = isProduction ? 
  'https://' + domainName + ':' + sslPort + '/' :
  'http://' + domainName + ':' + port + '/';

process.on('uncaughtException', function (error) {
  console.error('Uncaught error : ', error);
});

(async function () {
  app.disable('etag');
  app.use(compress());
  app.use(bodyParser.json());

  await initializeDatabase();
  require('./src/server/routes.js')(app);

  if (isProduction) {
    app.use(express.static('./build'));
  } else {
    console.info('adding webpack');
    const webpackConfig = require('./webpack.config.babel');
    const compiler = webpack(webpackConfig);

    const middleware = [
      webpackDevMiddleware(compiler, {
        publicPath: '/', // Same as `output.publicPath` in most cases.
        contentBase: path.join(__dirname, 'src', 'client'),
        hot: true,
        stats: {
          colors: true,
        },
      }),
      webpackHotMiddleware(compiler, {
        log: console.log, // eslint-disable-line no-console
        heartbeat: 2000,
        path: '/__webpack_hmr',
      }),
    ];

    app.use(middleware);
  }

  app.use(function pushstatehook (req, res, next) {
    var ext = path.extname(req.url);
    console.info(ext, req.url);
    if ((ext === '' || ext === '.html') && req.url !== '/') {
      console.info('returning the index.html here');
      console.info(req.url);
      console.info(baseURL);
      req.pipe(request(baseURL)).pipe(res);
    } else {
      next();
    }
  });

  if (isProduction) {
    app = require('greenlock-express')
      .create({
        email: adminEmail,
        servername: domainName,
        agreeTos: true,
        configDir: '~/.config/acme/',
        app: app,
    })
  }

  function appListenSuccess() {
    console.log('╔═══════════════════════════════════════════════════════════'.green.bold);
    console.log('║ Background Geolocation Server | port: %s'.green.bold, port);
    if (isProduction) {
      console.log('║                               | sslPort: %s'.green.bold, sslPort);
    }
    console.log('╚═══════════════════════════════════════════════════════════'.green.bold);

    // Spawning dedicated process on opened port.. only if not deployed on heroku
    if (!process.env.DYNO) {
      opn(baseURL)
        .catch(function (error) { console.log("Optional site open failed:", error); });
    }
  }

  if (isProduction) {
    app.listen(port, sslPort, appListenSuccess);
  } else {
    app.listen(port, appListenSuccess);
  }
})();
