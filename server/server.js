// const log = require('why-is-node-running'); // For debugging

// require('dotenv').config();
require('dotenv').config({ path: `${__dirname}/../../.env`, debug: false });
const fs = require('fs');
const express = require("express");
const GracefulShutdownManager = require('@moebius/http-graceful-shutdown').GracefulShutdownManager;
const history = require('connect-history-api-fallback');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bus = require('./utils/bus.js');

console.log('\n++++++++++ SERVER STARTING UP ++++++++++\n');

const { appInitCors } = require('./utils/cors.js');
const { router:authRouter } = require('./routes/auth.js'); // The colon just renames the imported name of router to authRouter
const { router:apiRouter} = require('./routes/api.js');
const socketio = require('./socketio/socketio.js');

const { fsWatcher } = require('./helpers/jvmStatus.js');

// console.log(`${__dirname} ${process.cwd()}`);

// Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

// Initiate our app
const app = express();

const port = process.env.PORT || 3030;
const httpPort = 8181; // For redirect, TODO change to 8080
const devPort = 8182;

// Set API fallback history mode for use with SPA-style website
app.use(history());

// Configure CORS
const allowedOrigins = [ `https://localhost:${port}`,
    `https://localhost:${devPort}`,
    `https://xlla9588.citacx.acxiom.com:${devPort}`,
    `https://xlla9588.citacx.acxiom.com:${port}` ];
appInitCors(app, allowedOrigins);
// END CORS

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

// TODO re-enable this when migrating websites
// Redirect http to https on diff port, not possible to listen on the same port
const httpApp = express();
httpApp.use(function (req, res, next) {
    if (!req.secure) {
        // console.log(req);
        const redirURL = ['https://', req.get('Host'), req.baseUrl].join('').replace(/:[0-9]{4}/, `:${port}`);
        console.warn(`Insecure hit! Redirect: ${redirURL}`);
        return res.redirect(redirURL);
    }
    next();
});
httpApp.listen(httpPort, () => {
    console.log(`${new Date()} HTTP redirect server started at https://localhost:${httpPort}`);
});
// End redirect

// Serve static vuejs website
// Disabled for now, TODO re-enable and move in new compiled vue app
app.get('/', (req, res) => {
    res.sendFile('index.html');
});

// Set up auth routes
app.use(authRouter);
// Set up API routes
app.use(apiRouter);

const server = require('https').createServer({
    key: fs.readFileSync(process.env.SERVER_KEY_PATH),
    cert: fs.readFileSync(process.env.SERVER_CERT_PATH)
}, app);

// Set up and run socket.io server
const io = socketio.listen(server);

server.listen(port, () => {
    console.log(`${new Date()} Server started at https://localhost:${port}`);
});

const shutdownManager = new GracefulShutdownManager(server);

// Important to close any open resources so pm2 can restart the server properly
function exit() {
    if (fsWatcher) {
        fsWatcher.close();
    }
    // bus.removeAllListeners();
    if (io) {
        io.close(() => {
            shutdownManager.terminate(() => {
                console.log('Server is gracefully terminated');
                // console.log('--- Post exit ---');
                // log();
                // process.exit(1);
                process.exit(0);
            });
        });
    }

}

process.on('SIGINT', function () {
    console.info(`Caught SIGINT signal`);
    exit();
});
process.on('SIGTERM', function () {
    console.info(`Caught SIGTERM signal`);
    exit();
});

////////////////////////////////

// TESTING

// (async () => {
//     readMaskedPropertiesFiles();
// })();

// const splitToken = createAccessToken({ userid: 'ztaylo' });
// console.log(`splitToken: ${JSON.stringify(splitToken, undefined, 2)}`);
// const decoded = jwt.verify(`${splitToken.hpayload}.${splitToken.signature}`, SECRET_KEY);
// console.log(decoded);