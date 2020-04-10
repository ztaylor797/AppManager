import VueSocketIOExt from 'vue-socket.io-extended';
import io from 'socket.io-client';

// "async" is optional
export default ({ Vue, store /* app, router, Vue, ... */ }) => {
    // autoConnect: false defers connection until we manually connect in the store once the user has logged in and cookies are generated.
    const socket = io(
        process.env.generateAPIURL(location.hostname),
        { autoConnect: false }
    );

    Vue.use(VueSocketIOExt, socket, { store });
}
