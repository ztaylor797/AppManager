var socketio = require('socket.io');
// const socketioAuth = require("socketio-auth");
const bus = require('../utils/bus.js');
const { verifyToken } = require('../routes/auth.js');

// const { jvmInfo:initialJvmInfo } = require('../server.js');

// let clientSockets = new Map();

const extractSocketCookies = socket => {
    // Extract cookies from socket headers
    const cookiesStr = socket.handshake.headers.cookie;
    const cookiesArr = cookiesStr.split(';');
    const cookies = {};
    cookiesArr.forEach(str => {
        const [key, val] = str.trim().split('=');
        cookies[key] = val;
    });

    const hpayloadCookie = cookies.hpayloadCookie;
    const signatureCookie = cookies.signatureCookie;

    console.log(`hpayloadCookie: ${hpayloadCookie}`);
    console.log(`signatureCookie: ${signatureCookie}`);

    return { hpayloadCookie, signatureCookie };
}

const authenticateSocketCookies = (socket) => {
    console.log(`Client attempting to authenticate [id=${socket.id}]`);
    socket.auth = false;

    const { hpayloadCookie, signatureCookie } = extractSocketCookies(socket);

    if (!hpayloadCookie || !signatureCookie) {
        const errMsg = 'One or more cookie was missing, cannot authenticate.';
        console.error(errMsg);
        throw new Error(errMsg);
    }

    try {
        const decoded = verifyToken(hpayloadCookie, signatureCookie);
        console.log(`Decoded: ${JSON.stringify(decoded, undefined, 2)}`);
        socket.auth = true;
        if (decoded.userid) {
            socket.userid = decoded.userid;
        }
        return true;
    } catch (err) {
        console.error(`Error verifyToken in socketio connect: `, err);
        throw err;
    }
};

// MW for middleware, this just wraps the authenticateSocketCookies method
const authenticateMW = (socket, callback) => {
    try {
        authenticateSocketCookies(socket);
        callback(null, true);
    } catch (err) {
        callback(err);
    }
};

// function login (socket) {
//     console.log(socket.id + ' login');
//     authenticate(socket);
// }

// function logout (socket) {
//     console.log(socket.id + ' logout');
//     socket.auth = false;
// }

function disconnect (reason) {
    console.log(`Client disconnected: ${reason}`);
}

module.exports.listen = function (server) {
    const io = socketio.listen(server);

    // auth middleware
    io.use(authenticateMW);

    io.on('connection', (socket) => {
        socket.on('disconnect', disconnect);
    });

    const emitToAllAuthedUsers = (event, data) => {
        Object.keys(io.sockets.sockets).forEach((socket) => {
            let useridStr = '';
            if (io.sockets.sockets[socket].userid) {
                useridStr = ' userid: ' + io.sockets.sockets[socket].userid;
            }
            console.log(`Event: ${event} Socket: ${io.sockets.sockets[socket].id} auth: ${io.sockets.sockets[socket].auth}${useridStr}`);
            if (io.sockets.sockets[socket].auth) {
                io.sockets.sockets[socket].emit(event, data);
            }
        });
    }

    bus.on('jvmStateUpdated', (jvmInfo) => {
        // console.log('Emitting jvmStateUpdated');

        // io.sockets.emit('jvmStateUpdated', jvmInfo);
        // Instead of emitting to all users, loop over all connected and check if they are authenticated before emitting to them
        emitToAllAuthedUsers('jvmStateUpdated', jvmInfo);
    });

    return io;
}

        // socket.on('', async (obj) => {
        //     console.log(`Sending criteria...`);
        //     socket.emit('sendAvailableCriteria', availableCriteria);
