<template>
    <q-page>
        <h4>JVM Info</h4>
        <CommErrorBanner v-if="errored" />
        <div v-else>
            <!-- <pre>{{ JSON.stringify(jvmInfo.uat1, undefined, 2) }}</pre> -->
            <div class="row items-start q-gutter-md">
                <JVMInfoCard v-for="(info, jvm) in jvmInfo"
                    :info="info"
                    :jvm="jvm"
                    :key="jvm"
                    :now="now"
                    :expanded="expanded"
                    @toggleExpanded="expanded = !expanded"
                />
            </div>
            <q-inner-loading :showing="loading">
                <q-spinner-gears size="50px" color="primary" dark />
            </q-inner-loading>
        </div>
    </q-page>
</template>

<script>
import CommErrorBanner from 'components/CommErrorBanner';
import JVMInfoCard from 'components/JVMInfoCard';
import { getJvmInfo } from '@/utils/api.js';

export default {
    name: 'JVMInfo',
    components: {
        CommErrorBanner,
        JVMInfoCard
    },
    data () {
        return {
            loading: true,
            errored: false,
            jvmInfo: undefined,
            expanded: false,
            interval: undefined,
            now: undefined
        }
    },
    methods: {
        async refreshJvmInfo() {
            try {
                this.jvmInfo = await getJvmInfo();
                // console.log(JSON.stringify(this.jvmInfo.uat1, undefined, 2));
            } catch (error) {
                console.error(`mounted: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
            } finally {
                this.loading = false;
            }
        },
        time() {
            this.now = new Date();
        }
    },
    async mounted() {
        this.refreshJvmInfo();
        this.interval = setInterval(this.time, 1000);
    },
    beforeDestroy() {
        clearInterval(this.interval);
    },
    computed: {
        jvmStates() {
            return this.$store.state.jvmStates;
        }
    },
    watch: {
        // This is to refresh the lastbootup timestamp whenever a jvm starts up while the page is already loaded
        jvmStates(newStates, oldStates) {
            if (!oldStates) {
                return;
            }
            for (const [jvm, state] of Object.entries(newStates)) {
                // console.log(`${jvm}: ${state}`);
                if (state === 'BOOTING' && oldStates[jvm] && oldStates[jvm] !== 'BOOTING') {
                    // console.log('REFRESH!!!');
                    this.refreshJvmInfo();
                }
            }
        }
    }
}
</script>
