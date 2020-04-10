<template>
    <div v-if="jvmStates && Object.keys(jvmStates).length > 0" class="row text-weight-medium text-center justify-evenly" >
        <div class="col-xs-12 col-md-auto col-divider q-px-md">
            JVM STATUS
            <span v-if="lastUpdated">
                Last Update: <span :class="lastUpdatedTextClass">{{ lastUpdated | epochSecToPretty }}</span>
            </span>
            <q-tooltip anchor="top middle" self="bottom middle" content-class="text-body2 bg-primary" :offset="[30, 30]">
                JVM status is checked every 15 seconds and pushed to this page. If the date shown is old, you've lost connectivity or something is wrong with the backend status monitor.
            </q-tooltip>
        </div>
        <template v-for="(state, jvm) in jvmStates">
            <div class="col col-xs-6 col-sm-3 col-md col-divider" :key="jvm">
                <span v-if="state === 'BOOTING' || state === 'DEPLOYING'">
                    <q-spinner-gears
                        color="info"
                        size="1.5rem"
                        class="q-mr-sm"
                    />
                </span>
                <q-icon v-else
                    :name="statusDisplay(state).iconName"
                    :color="statusDisplay(state).color"
                    size="1rem"
                    class="q-mr-sm"
                />
                {{ jvm }}<span class="gt-sm">&nbsp;&nbsp;{{ state }}</span>
                <q-tooltip anchor="top middle" transition-show="fade" transition-hide="fade" self="bottom middle" content-class="text-body2 bg-primary" :offset="[10, 10]" :key="jvm">
                    State: {{ state }} - {{ statusDisplay(state).definition }}
                </q-tooltip>
            </div>
            <!-- </div> -->
        </template>
    </div>
    <div v-else class="text-center">
        <template v-if="!firstIntervalPassed">
            <q-spinner-hourglass
                size="1rem"
                class="q-mr-sm"
                color="primary"
            />
            Waiting for first JVM update.
        </template>
        <template v-else>
            <q-icon
                name="fas fa-exclamation-triangle"
                size="1rem"
                class="q-mr-sm"
                color="warning"
            />
            Could not obtain current JVM status.
        </template>
    </div>
</template>

<script>
import { date } from 'quasar';
import { getStateDisplayProperties } from '../utils/jvmStateUtilities';

export default {
    name: 'AllJVMStatus',
    data () {
        return {
            timeout: undefined, // Used to check if we're in the first 15 seconds of loading the site
            firstIntervalPassed: false,
            interval: undefined, // Used to execute the time() method on an interval so we can update the UI based on how long since last update
            now: undefined
        };
    },
    // sockets: {
    //     connect() {
    //         console.log('Socket connected!')
    //     },
    //     jvmStateUpdated(newJvmInfo) {
    //         console.log(`JVM state update received! ${JSON.stringify(newJvmInfo, undefined, 2)}`);
    //         this.lastUpdated = newJvmInfo.timestamp;
    //         this.jvmStates = newJvmInfo.jvmStates;
    //     }
    // },
    mounted() {
    //     this.$socket.client.emit('getJvmState');
    //     // Call store action here
        this.$store.dispatch('getJvmState');
        this.timeout = setTimeout(() => {
            this.firstIntervalPassed = true;
        }, 16000);
        this.interval = setInterval(this.time, 10000); // This one is every 10 seconds instead of 1 second
    },
    beforeDestroy() {
        clearInterval(this.interval);
        clearTimeout(this.timeout);
    },
    computed: {
        lastUpdated() {
            return this.$store.state.jvmStateLastUpdated;
        },
        lastUpdatedTextClass() {
            const then = new Date(parseInt(`${this.lastUpdated}000`));
            const minDiff = date.getDateDiff(this.now, then, 'minutes');
            if (minDiff > 5) {
                return 'text-negative';
            } else {
                return 'text-primary';
            }
        },
        jvmStates() {
            return this.$store.state.jvmStates;
        }
    },
    methods: {
        statusDisplay(state) {
            return getStateDisplayProperties(state);
        },
        time() {
            this.now = new Date();
        }
    }
}
</script>

<style lang="sass" scoped>
.col-divider
    border-right: 2px solid $dark;
    border-left: 2px solid $dark;
</style>
