const bus = require('../utils/bus.js');
const { watchFileAndRunMethodOnChange } = require('../utils/fileUtils.js');

// JVM STATE /////////////////////////
let jvmInfo = {};
let first = true;

bus.on('getJvmState', () => {
    bus.emit('jvmStateUpdated', jvmInfo);
});

const fsWatcher = watchFileAndRunMethodOnChange(process.env.JVM_STATE_PATH, (contents) => {
    const lines = contents.split('\n');
    if (lines.length < 0) {
        return;
    }

    // Doing this instead of creating a new empty object because we export this and use it in other files like socketio.js
    for (const key in jvmInfo) {
        delete jvmInfo[ key ];
    }
    // let jvmInfo = {};
    const jvmStates = {};

    lines.forEach(line => {
        const [ key, value ] = line.split('=');
        if (key === 'timestamp') {
            jvmInfo[ key ] = value;
        } else {
            jvmStates[ key ] = value;
        }
    });
    jvmInfo.jvmStates = jvmStates;

    // Emit update here via websocket
    // console.log(`Emitting jvmStateUpdated event over bus: ${JSON.stringify(jvmInfo, undefined, 2)}`);
    bus.emit('jvmStateUpdated', jvmInfo);

    if (first) {
        first = false;
        // To notify pm2 that init is finished
        process.send('ready');
    }
});

module.exports = {
    fsWatcher
}
