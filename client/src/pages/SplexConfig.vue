<template>
    <q-page>
        <h4>SharePlex Config</h4>
        <CommErrorBanner v-if="errored" />
        <div v-else>
            <p>
                <InfoBanner>This information is updated once a day at 8 AM.</InfoBanner>
            </p>
            <div class="row">
                <!-- <pre>{{ JSON.stringify(splexConfig, undefined, 2) }}</pre> -->
                <q-card v-if="splexConfig" dense bordered class="splex-card">
                    <q-card-section class="bg-primary">
                        <div class="text-h6">Current Config</div>
                        <div class="text-subtitle2">{{ splexConfig.fileObj.fileBasename }} - Modified: {{ splexConfig.fileObj.stats.mtimeMs | epochMSToPretty }}</div>
                        <div class="text-subtitle2">Datasource: {{ splexConfig.contents.datasource }}</div>
                    </q-card-section>

                    <!-- <q-separator /> -->

                    <q-card-section style="white-space: pre-line; word-break: break-all; padding: 0">
                        <q-markup-table dense square flat class="text-left splex-table">
                            <thead class="bg-primary">
                                <tr>
                                    <th>Source Table</th>
                                    <th>Key Definition</th>
                                    <th>Destination Table</th>
                                    <th>Routing Map</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="obj in splexConfig.contents.entries" :key="obj.sourceTable">
                                    <td>{{ obj.sourceTable }}</td>
                                    <td>{{ obj.keyDef }}</td>
                                    <td>{{ obj.destTable }}</td>
                                    <td>{{ obj.routingMap }}</td>
                                </tr>
                            </tbody>
                        </q-markup-table>
                    </q-card-section>
                </q-card>
                <q-inner-loading :showing="loading">
                    <q-spinner-gears size="50px" color="primary" dark />
                </q-inner-loading>
            </div>
        </div>
    </q-page>
</template>

<script>
import CommErrorBanner from 'components/CommErrorBanner';
import InfoBanner from 'components/InfoBanner';

import { getSplexConfig } from '@/utils/api.js';

export default {
    name: 'SplexConfig',
    components: {
        CommErrorBanner,
        InfoBanner
    },
    data () {
        return {
            loading: true,
            errored: false,
            splexConfig: undefined
        }
    },
    methods: {
        async refreshSplexConfig() {
            try {
                this.splexConfig = await getSplexConfig();
                // console.log(JSON.stringify(this.jvmInfo.uat1, undefined, 2));
            } catch (error) {
                console.error(`mounted: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
            } finally {
                this.loading = false;
            }
        }
    },
    async mounted() {
        this.refreshSplexConfig();
    }
}
</script>

<style lang="sass" scoped>
.splex-card
    max-width: 1100px;
    width: 100%;
    // max-width: 500px;
    // tr > :nth-child(1)
        // font-weight: bold;
    // tr > :nth-child(2)
        // width: 70%;
.splex-table
    width: 100%;
</style>
