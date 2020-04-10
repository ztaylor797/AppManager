import Vue from 'vue';
import VueRouter from 'vue-router';
// import store from '@/store';

import routes from './routes';

Vue.use(VueRouter);

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default function ({ store }) {
    const Router = new VueRouter({
        scrollBehavior: () => ({ x: 0, y: 0 }),
        routes,

        // Leave these as they are and change in quasar.conf.js instead!
        // quasar.conf.js -> build -> vueRouterMode
        // quasar.conf.js -> build -> publicPath
        mode: process.env.VUE_ROUTER_MODE,
        base: process.env.VUE_ROUTER_BASE
    });

    // This probably needs to be done in the quasar boot files
    // Router.beforeEach((to, from, next) => {
    //     // This is to save the very first route a user tries to hit so it can redirect to it if they've already authenticated in a previous session
    //     if (!store.state.toRoute && to.path !== '/login') {
    //         store.commit('toRoute', to);
    //     }

    //     if (to.matched.some(record => record.meta.requiresAuth)) {
    //         // this route requires auth, check if logged in
    //         // if not, redirect to login page.
    //         if (!store.getters.isAuthenticated) {
    //             next({
    //                 path: '/login'
    //                 // query: { redirect: to.fullPath } // Not needed, saving in store
    //             })
    //         } else {
    //             next();
    //         }
    //     } else if (to.matched.some(record => record.meta.skipIfAuth)) {
    //         if (store.getters.isAuthenticated) {
    //             next(false);
    //         } else {
    //             next();
    //         }
    //     } else {
    //         next(); // make sure to always call next()!
    //     }
    // });

    Router.beforeEach((to, from, next) => {
        // This is to save the very first route a user tries to hit so it can redirect to it if they've already authenticated in a previous session
        console.log(`to.path: ${to.path}`);
        // if (!store.state.toRoute && to.path !== '/login') {
        if (to.path && to.path !== '' && to.path !== '/login') {
            console.log(`commit toRoute to.path: ${to.path}`);
            store.commit('toRoute', to);
        }

        if (to.matched.some(record => record.meta.requiresAuth)) {
            // this route requires auth, check if logged in
            // if not, redirect to login page.
            if (!store.getters.isAuthenticated) {
                next({
                    path: '/login'
                    // query: { redirect: to.fullPath } // Not needed, saving in store
                })
            } else {
                next();
            }
        } else if (to.matched.some(record => record.meta.skipIfAuth)) {
            if (store.getters.isAuthenticated) {
                next(false);
            } else {
                next();
            }
        } else {
            next(); // make sure to always call next()!
        }
    });

    return Router;
}
