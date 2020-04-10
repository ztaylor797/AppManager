<template>
  <q-layout view="lHh Lpr fFf">

    <q-header class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense stretch flat icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-btn stretch flat to="/" no-caps>
            <q-toolbar-title>S4 Manager</q-toolbar-title>
        </q-btn>
        <q-space />
        <!-- <div class='q-mr-md'>{{ $route.fullPath }}</div> -->
        <q-separator vertical />
        <AuthBarSection />
        <q-separator vertical />
        <div class="q-pl-md">v{{ appVersion }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
        v-model="leftDrawerOpen"
        :mini="miniState"
        @mouseover="mouseOnDrawer = true"
        @mouseout="mouseOnDrawer = false"
        side="left"
        bordered
    >
        <!-- px subtracted should match the top toolbar's height -->
        <q-scroll-area
            style="height: calc(100% - 50px); margin-top: 50px;"
        >
            <q-list>
                <q-item-label header>
                    JVM
                </q-item-label>
                <EssentialLink
                    v-for="link in jvmLinks"
                    :key="link.title"
                    v-bind="link"
                />
                <q-separator class="q-mt-sm" />
                <q-item-label header>Batch</q-item-label>
                <EssentialLink
                    v-for="link in batchLinks"
                    :key="link.title"
                    v-bind="link"
                />
                <q-separator class="q-mt-sm" />
                <q-item-label header>Misc</q-item-label>
                <EssentialLink
                    v-for="link in miscLinks"
                    :key="link.title"
                    v-bind="link"
                />
            </q-list>
        </q-scroll-area>

        <q-toolbar
            class="bg-primary text-white absolute-top"
        >
            <q-toolbar-title v-show="!miniState">
                Links
            </q-toolbar-title>
            <q-btn
                :icon="pinnedIcon"
                @click="toggleDrawerPinned"
                size="sm"
                round flat
            >
                <q-tooltip>{{ drawerPinned ? 'Unpin the left menu' : 'Pin the left menu' }}</q-tooltip>
            </q-btn>
        </q-toolbar>
    </q-drawer>

    <q-page-container>
        <!-- These two wrappers are to get the scroll area and scrollbar working properly on the main page content -->
        <q-page class="row no-wrap">
            <q-scroll-area class="col q-pl-md q-pr-md q-py-xs">
                <router-view id='my-router-view' :key="$route.fullPath" v-scroll="scrolled" />
            </q-scroll-area>
            <q-page-sticky position="bottom-right" :offset="[22, 18]">
                <transition
                    appear
                    enter-active-class="animated fadeIn"
                    leave-active-class="animated fadeOut"
                >
                    <q-btn
                        v-show="fabVisible"
                        icon="keyboard_arrow_up"
                        color="primary"
                        outline
                        @click="backToTop"
                        round
                    />
                </transition>
            </q-page-sticky>
        </q-page>
    </q-page-container>

    <q-footer reveal bordered class="bg-grey-10 text-white gt-xs">
        <AllJVMStatus />
    </q-footer>

  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink';
import AllJVMStatus from 'components/AllJVMStatus';
import AuthBarSection from 'components/AuthBarSection';

import { scroll } from 'quasar';
const { getScrollTarget, setScrollPosition } = scroll;

export default {
    name: 'MainLayout',

    components: {
        EssentialLink,
        AllJVMStatus,
        AuthBarSection
    },
    methods: {
        toggleDrawerPinned() {
            this.drawerPinned = !this.drawerPinned;
            this.$q.cookies.set('s4_manager_drawer_pinned', this.drawerPinned, {
                path: '/',
                sameSite: 'Lax',
                expires: '730d'
            });
        },
        scrolled(position) {
            // console.log(`position: ${position}`);
            if (position <= 100) {
                this.fabVisible = false;
            } else {
                this.fabVisible = true;
            }
        },
        backToTop() {
            setScrollPosition(getScrollTarget(document.getElementById('my-router-view')), 0, 350);
        }
    },
    computed: {
        appVersion() {
            return this.$store.getters.appVersion;
        },
        miniState() {
            return !this.mouseOnDrawer && !this.drawerPinned;
            // return !this.mouseOnDrawer;
        },
        pinnedIcon() {
            return this.drawerPinned ? 'mdi-pin' : 'mdi-pin-off';
        }
    },
    mounted() {
        if (this.$q.cookies.has('s4_manager_drawer_pinned')) {
            this.drawerPinned = this.$q.cookies.get('s4_manager_drawer_pinned');
        }
        // console.log('drawerPinned: ' + this.drawerPinned);
    },
    data () {
        return {
            fabVisible: false,
            leftDrawerOpen: true,
            mouseOnDrawer: false,
            drawerPinned: true,
            // Icon list here: https://material.io/resources/icons/?icon=settings_applications&style=baseline
            jvmLinks: [
                {
                    title: 'JVM Info',
                    caption: 'Various JVM Info',
                    icon: 'power_settings_new',
                    link: '/jvminfo'
                },
                {
                    title: 'DB Schema Config',
                    caption: 'Change JVM database',
                    icon: 'view_carousel',
                    link: '/dbconfig'
                },
                {
                    title: 'Outbound Endpoint Status',
                    caption: 'FDR/AMF connectivity',
                    icon: 'sync_alt',
                    link: '/outboundstatus'
                },
                {
                    title: 'FDR Port/User Config',
                    caption: 'Change JVM ESB port',
                    icon: 'settings_applications',
                    link: '/fdrconfig'
                },
                {
                    title: 'ESB Port Config',
                    caption: 'Change JVM ESB port',
                    icon: 'settings',
                    link: '/esbports'
                },
                {
                    title: 'EAR Contents',
                    caption: 'Deployed EAR contents',
                    icon: 'list',
                    link: '/earcontents'
                },
                {
                    title: 'Properties Files',
                    caption: 'View JVM prop file contents',
                    icon: 'description',
                    link: '/propertiescontents'
                }
            ],
            batchLinks: [
                {
                    title: 'S4 Citi Dev Wiki',
                    caption: 'Details on file drop zones and others',
                    icon: 'info',
                    link: '/wiki',
                    disableExact: true
                },
                {
                    title: 'Email Distro Config',
                    caption: 'citimaildist details',
                    icon: 'email',
                    link: '/emailconfig'
                },
                {
                    title: 'QA Batch Schema Config',
                    caption: 'View batch schema settings',
                    icon: 'settings',
                    link: '/batchschemaconfig'
                },
                {
                    title: 'Citi to Acxiom Regions',
                    caption: 'Map of Citi<->Acxiom Envs',
                    icon: 'info',
                    link: '/regionmap'
                }
            ],
            miscLinks: [
                {
                    title: 'SharePlex Tables',
                    caption: 'View SharePlex config',
                    icon: 'sync',
                    link: '/splexconfig'
                },
                {
                    title: 'SharePlex Sync Check',
                    caption: 'View SharePlex sync status',
                    icon: 'sync_problem',
                    link: '/splex_status',
                    disabled: true
                },
                {
                    title: 'S4 Acxiom-Citi Network Diagram',
                    caption: 'S4-related network details',
                    icon: 'device_hub',
                    link: '/networkdiagram'
                },
                {
                    title: 'S4 NDM Config',
                    caption: 'Details on S4 NDM nodes',
                    icon: 'compare_arrows',
                    link: '/ndmconfig'
                }
            ]
        }
    }
}
</script>
