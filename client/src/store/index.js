import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios';
// import router from '@/router';

import { getPayload } from '@/utils/cookieUtilities.js';
import { version } from '../../package.json';
import { Notify, Loading } from 'quasar';

// console.log(`VERSION: ${version}`);
// import example from './module-example'

Vue.use(Vuex);

/*
* If not building with SSR mode, you can
* directly export the Store instantiation;
*
* The function below can be async too; either use
* async/await or return a Promise which resolves
* with the Store instance.
*/

export default function (/* { ssrContext } */) {
    const Store = new Vuex.Store({
        state: {
            toRoute: null,
            // packageVersion: process.env.PACKAGE_VERSION || '0',
            packageVersion: version || '0',
            // registrationStatus: undefined,
            // autoLoginAttemptFinished: false,
            loginStatus: undefined,
            tokenPayload: null,
            logoutHandler: null,
            jvmStateLastUpdated: null, // in epochSeconds not milliseconds
            jvmStates: null
        },
        getters: {
            appVersion(state) {
                const ver = state.packageVersion.toString();
                // if (state.projectStage) {
                //     ver += '-' + state.projectStage;
                // }
                // console.log(`VERSION: ${ver}`);

                return ver;
            },
            isAuthenticated(state) {
                // eslint-disable-next-line
                return state.tokenPayload ? true : false;
            },
            // "method-style access" for using getters with parameter passed in, "jvm" variable in this case
            singlejvmState: (state) => (jvm) => {
                if (state.jvmStates && jvm in state.jvmStates) {
                    return state.jvmStates[jvm];
                } else {
                    return null;
                }
            }
        },
        mutations: {
            // storeUser (state, user) {
            //     state.user = user;
            // },
            toRoute(state, toRoute) {
                state.toRoute = toRoute;
            },
            setAuthData(state, tokenPayload) {
                state.tokenPayload = tokenPayload;
            },
            clearAuthData(state) {
                state.tokenPayload = null;
            },
            setLogoutHandler(state, logoutHandler) {
                state.logoutHandler = logoutHandler;
            },
            // setRegistrationStatus (state, registrationStatus) {
            //     state.registrationStatus = registrationStatus;
            // },
            // setAutoLoginAttemptFinished (state, finished) {
            //     state.autoLoginAttemptFinished = finished;
            // },
            setLoginStatus(state, loginStatus) {
                state.loginStatus = loginStatus;
            },
            // SOCKET_JVMSTATEUPDATED (state, newJvmInfo) {
            updateJvmState (state, newJvmInfo) {
                // console.log(`SOCKET_JVMSTATEUPDATED invoked: ${JSON.stringify(newJvmInfo, undefined, 2)}`);
                state.jvmStateLastUpdated = newJvmInfo.timestamp;
                state.jvmStates = newJvmInfo.jvmStates;
            }
        },
        actions: {
            setLogoutTimer({ state, dispatch }, msToExpire) {
                if (!msToExpire) {
                    msToExpire = new Date(state.tokenPayload.exp * 1000).getTime() - new Date().getTime();
                }
                // console.log(`token exp seconds:${state.tokenPayload.exp} date: ${new Date(state.tokenPayload.exp * 1000)}`)
                // console.log(`Setting logout timer for ${msToExpire} ms... (${Math.round(msToExpire / 1000 / 60)} minutes)`);
                // timeout handler
                const logoutHandler = setTimeout(() => {
                    dispatch('logout');
                }, msToExpire);
                this.commit('setLogoutHandler', logoutHandler);
            },
            // register({ commit, dispatch }, authData) {
            //     commit('setRegistrationStatus', 'Authenticating');
            //     axios
            //         .post('/api/register', {
            //             userid: authData.userid,
            //             email: authData.email,
            //             password: authData.password,
            //             name: authData.name
            //         })
            //         .then(res => {
            //             // console.log(JSON.stringify(res, undefined, 2));

            //             if (res.data.registrationSuccessful === true) {
            //                 commit('setRegistrationStatus', 'Successful');
            //                 console.log('Registration successful!');
            //                 Notify.create({
            //                     message: 'Registration successful! Please login.',
            //                     type: 'positive',
            //                     icon: 'fas fa-check-circle'
            //                 });
            //                 this.$router.replace('/login');
            //             } else {
            //                 console.error('Unknown registration failure!');
            //                 commit('setRegistrationStatus', 'Unknown registration error');
            //             }
            //         })
            //         .catch(error => {
            //             if (error.response) {
            //                 const res = error.response;
            //                 console.error('Registration failed!');
            //                 if (res.status === 401) {
            //                     commit('setRegistrationStatus', 'Invalid password');
            //                 } else if (res.status === 405) {
            //                     commit('setRegistrationStatus', 'User already registered');
            //                 } else if (res.status === 500) {
            //                     commit('setRegistrationStatus', 'Server error');
            //                 } else {
            //                     commit('setRegistrationStatus', 'Unknown error');
            //                 }
            //             } else {
            //                 commit('setRegistrationStatus', 'Communication error');
            //                 console.error(error);
            //             }
            //         });
            // },
            login({ commit, state, dispatch }, authData) {
                commit('setLoginStatus', 'Authenticating');
                axios
                    .post('/api/login', {
                        userid: authData.userid,
                        password: authData.password,
                        rememberMe: authData.rememberMe
                    })
                    .then(res => {
                        if (res.status === 200) {
                            commit('setLoginStatus', 'Successful');
                            this._vm.$q.cookies.set('s4_manager_userid', authData.userid, {
                                path: '/',
                                sameSite: 'Lax',
                                expires: '730d'
                            });
                            const payload = getPayload();
                            commit('setAuthData', payload);
                            dispatch('setLogoutTimer');
                            setTimeout(() => {
                                this._vm.$socket.client.open();
                                // this._vm.$socket.client.emit('login', { userid: state.tokenPayload.userid });
                            }, 1000);
                            console.log(state.toRoute);
                            // if (state.toRoute) {
                            //     // This option is for cases where a token-bearing user tries to navigate directly to a subpath rather than using the UI links to get there
                            //     this.$router.replace({ path: state.toRoute.path, query: state.toRoute.query });
                            // } else {
                            //     this.$router.replace('/');
                            // }
                            if (state.toRoute) {
                                // This option is for cases where a token-bearing user tries to navigate directly to a subpath rather than using the UI links to get there
                                // This additional if check is needed to prevent router errors when trying to replace the curr path with the same path on auto login success
                                if (state.toRoute.path !== this.$router.currentRoute.path && !/\/register|\/login/.test(state.toRoute.path)) {
                                    // console.log(`replace { path: ${state.toRoute.path}, query: ${state.toRoute.query} }`);
                                    this.$router.replace({ path: state.toRoute.path, query: state.toRoute.query });
                                } else {
                                    // console.log('replace secondary /');
                                    this.$router.replace('/');
                                }
                            } else {
                                // console.log('replace /');
                                this.$router.replace('/');
                            }
                        } else {
                            console.error('Unknown login failure!');
                            commit('setLoginStatus', 'Unknown error');
                        }
                    })
                    .catch(error => {
                        if (error.response) {
                            const res = error.response;
                            if (res.status === 401) {
                                console.error('Login attempt failed due to invalid password!');
                                commit('setLoginStatus', 'Invalid password');
                            } else if (res.status === 404) {
                                console.error('Login attempt failed due to user not found!');
                                commit('setLoginStatus', 'User not found');
                            } else if (res.status === 500) {
                                console.error('Login attempt failed due to server error when looking up user!');
                                commit('setLoginStatus', 'Server error');
                            }
                        } else {
                            commit('setLoginStatus', 'Communication error');
                            console.error(error);
                        }
                    });
            },
            tryAutoLogin({ commit, state, dispatch }) {
                const payload = getPayload();
                if (!payload) {
                    // commit('setAutoLoginAttemptFinished', true);
                    Loading.hide();
                    return;
                }

                axios
                    .get('/api/verify')
                    .then(res => {
                        // console.log(res);
                        if (res.status === 200) {
                            console.log('Auto cookie login successful!');
                            commit('setAuthData', payload);
                            // Seems like the hpayloadCookie isn't set if we invoke this immediately, added a slight delay, not ideal.
                            // setTimeout(() => this._vm.$socket.client.emit('authentication'), 1000);

                            setTimeout(() => {
                                this._vm.$socket.client.open();
                                // this._vm.$socket.client.emit('login', { userid: state.tokenPayload.userid });
                            }, 1000);
                            dispatch('setLogoutTimer');
                            // console.log('---- toRoute & currentRoute ---');
                            // console.log(state.toRoute);
                            // console.log(this.$router.currentRoute);
                            // console.log('---- END ---');
                            if (state.toRoute) {
                                // This option is for cases where a token-bearing user tries to navigate directly to a subpath rather than using the UI links to get there
                                // This additional if check is needed to prevent router errors when trying to replace the curr path with the same path on auto login success
                                if (state.toRoute.path !== this.$router.currentRoute.path && !/\/register|\/login/.test(state.toRoute.path)) {
                                    console.log(`replace { path: ${state.toRoute.path}, query: ${state.toRoute.query} }`);
                                    // if(state.toRoute.path)
                                    this.$router.replace({ path: state.toRoute.path, query: state.toRoute.query });
                                } else {
                                    // console.log('replace secondary /');
                                    this.$router.replace('/');
                                }
                            } else {
                                // console.log('replace /');
                                this.$router.replace('/');
                            }
                        } else {
                            console.warn(`Auto login failed! Response status: ${res.status}`);
                        }
                    })
                    .catch(error => {
                        console.warn(`Auto login failed! ${error}`);
                    })
                    .finally(() => {
                        // commit('setAutoLoginAttemptFinished', true);
                        Loading.hide();
                    });
            },
            clearAuthData({ commit }) {
                console.log('Clearing hpayloadCookie');
                document.cookie = 'hpayloadCookie= ; expires = Thu, 01 Jan 1970 00:00:00 GMT';
                commit('clearAuthData');
            },
            logout({ state, dispatch }) {
                // this._vm.$socket.client.emit('logout', { userid: state.tokenPayload.userid });
                this._vm.$socket.client.disconnect(true);
                dispatch('clearAuthData');
                if (state.logoutHandler) {
                    // console.log(`Clearing logout timeout handler`);
                    clearTimeout(state.logoutHandler);
                }
                this.$router.replace('/login');
            },
            // routeDashboard({ }, query) {
            //     this.$router.push({ path: '/dashboard/custom', query });
            // },
            getJvmState() {
                // console.log('Emitting getJvmState from store action');
                this._vm.$socket.client.emit('getJvmState');
            },
            socket_unauthorized ({ }, err) {
                console.error(`SocketIO unauthorized: ${err.message}`);
            },
            socket_jvmStateUpdated ({ state, dispatch, commit }, newJvmInfo) {
                // console.log(`socket_jvmStateUpdated invoked: ${JSON.stringify(newJvmInfo, undefined, 2)}`);
                console.log('socket_jvmStateUpdated received');
                // Passing as an array because dispatch only allows one parameter
                dispatch('notifyIfJvmStateChange', [state.jvmStates, newJvmInfo.jvmStates]);
                commit('updateJvmState', newJvmInfo);
            },
            notifyIfJvmStateChange ({ }, params) {
                const oldStates = params[0];
                const newStates = params[1];
                // console.log(`oldStates: ${JSON.stringify(oldStates, undefined, 2)}`);
                // console.log(`newStates: ${JSON.stringify(newStates, undefined, 2)}`);
                // To avoid notifying on initial page load when oldStates isn't defined
                if (!oldStates) {
                    return;
                }
                for (const [jvm, state] of Object.entries(newStates)) {
                    // console.log(`${jvm}: ${state}`);
                    if (this._vm.$q.appVisible) {
                        if (state !== 'ONLINE' && oldStates[jvm] && oldStates[jvm] === 'ONLINE') {
                            Notify.create({
                                message: `${jvm} has changed state from ONLINE to ${state}!`,
                                type: 'warning',
                                // color: 'white',
                                classes: 'text-white',
                                icon: 'fas fa-exclamation-triangle'
                            });
                        } else if (state === 'ONLINE' && oldStates[jvm] && oldStates[jvm] !== 'ONLINE') {
                            Notify.create({
                                message: `${jvm} is now ONLINE!`,
                                type: 'positive',
                                icon: 'fas fa-check-circle'
                            });
                        }
                    }
                }
            }
        },
        modules: {
        }

        // enable strict mode (adds overhead!)
        // for dev mode only
        // strict: process.env.DEV
    })

    return Store;
}
