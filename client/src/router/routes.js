// const meta = { requiresAuth: true };
import wikiRoutes from './wikiRoutes';

const routes = [
    {
        path: '/login',
        component: () => import('layouts/Login.vue'),
        meta: { skipIfAuth: true }
    },
    // {
    //     path: '/register',
    //     component: () => import('layouts/Register.vue'),
    //     meta: { skipIfAuth: true }
    // },
    {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            { path: '', component: () => import('pages/Index.vue') },
            { path: '/user', component: () => import('pages/User.vue') },
            { path: '/dbconfig', component: () => import('pages/DBConfig.vue') },
            { path: '/jvminfo', component: () => import('pages/JVMInfo.vue') },
            { path: '/earcontents', component: () => import('pages/EarContents.vue') },
            { path: '/outboundstatus', component: () => import('pages/OutboundStatus.vue') },
            { path: '/propertiescontents', component: () => import('pages/PropertiesContents.vue') },
            { path: '/splexconfig', component: () => import('pages/SplexConfig.vue') },
            { path: '/networkdiagram', component: () => import('pages/NetworkDiagram.vue') },
            { path: '/ndmconfig', component: () => import('pages/NDMConfig.vue') },
            { path: '/regionmap', component: () => import('pages/RegionMap.vue') },
            { path: '/fdrconfig', component: () => import('pages/FDRConfig.vue') },
            { path: '/esbports', component: () => import('pages/ESBPorts.vue') },
            { path: '/emailconfig', component: () => import('pages/EmailConfig.vue') },
            { path: '/batchschemaconfig', component: () => import('pages/BatchSchemaConfig.vue') },
            ...wikiRoutes
        ],
        meta: { requiresAuth: true }
    }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
    routes.push({
        path: '*',
        component: () => import('pages/Error404.vue')
    });
}

export default routes;
