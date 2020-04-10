<template>
    <q-page :key="componentKey">
        <CommErrorBanner v-if="errored" />
        <div v-else>
            <h4>QA Batch DB Schema Config</h4>
            <p class="q-mt-md">Please select the schemas below as needed and click submit.</p>
            <InfoBanner>These entries control which db schemas a QA script connects to based on the identifier passed to the SetDBEnvs method.</InfoBanner>
            <InfoBanner infoType="warn">More than one script may use a particular ID. Please be careful changing these. Also, for IDs used by reporting scripts, they typically should only have one schema set.</InfoBanner>

            <!-- <p><pre>DIFFS: {{ JSON.stringify(diffs, undefined, 4) }}</pre></p>
            <p><pre>DIFFS valid: {{ diffsValid }}</pre></p> -->

            <q-form
                @submit="onSubmit"
                @reset="onReset"
                class="q-mt-lg"
            >
                <div class='q-mb-lg'>
                    <q-btn label="Submit" type="submit" icon-right="send" :disable="Object.keys(diffs).length <= 0 || !diffsValid" color="positive" />
                    <q-btn label="Reset" type="reset" icon-right="undo" color="primary" flat class="q-ml-sm" />
                </div>

                <InfoBanner infoType="error" v-if="updateSuccessful === false" class="q-mb-md">
                    Schema config update was unsuccessful.
                </InfoBanner>
                <InfoBanner infoType="positive" v-if="updateSuccessful === true" class="q-mb-md">
                    Schema config update was succesful!
                </InfoBanner>

                <!-- <p>{{ schemas }}</p> -->

                <!-- <p>{{ envOpts }}</p>
                <p>{{ selectedEnvs }}</p> -->

                <div class="row row-md-6 items-start q-gutter-md">
                    <BatchSchemaCard
                        v-for="(obj, env) in schemaConfig"
                        :key="env"
                        :env="env"
                        :allSchemas="allSchemas"
                        :schemaFileFP="obj.schemaFileFP"
                        :contents="obj.contents"
                        :entries="obj.entries"
                        :origSchemaConfig="origSchemaConfig"
                    />
                </div>
            </q-form>

            <!-- <pre class="text-red">{{ JSON.stringify(schemaConfig, undefined, 4) }}</pre> -->
        </div>
        <q-inner-loading :showing="loading">
            <q-spinner-gears size="50px" color="primary" dark />
        </q-inner-loading>
    </q-page>
</template>

<script>
// This script is a bit of a complex mess due to all the nested levels. Sorry future person.

import CommErrorBanner from 'components/CommErrorBanner';
import InfoBanner from 'components/InfoBanner';
import BatchSchemaCard from 'components/BatchSchemaCard';

// import { diff, areDiff } from '@/utils/objectUtilities.js';
import { extend } from 'quasar'; // Deep copy util

import { diff } from '@/utils/objectUtilities.js';

import { getBatchSchemaConfig, updateBatchSchemaConfig, getSchemas } from '@/utils/api.js';

export default {
    name: 'BatchSchemaConfig',
    components: {
        CommErrorBanner,
        InfoBanner,
        BatchSchemaCard
    },
    data: function() {
        return {
            componentKey: 0,
            loading: true,
            errored: false,
            origSchemaConfig: undefined,
            schemaConfig: undefined,
            updateSuccessful: undefined,
            // changes: {},
            allSchemas: []
        }
    },
    computed: {
        diffs() {
            return this.origSchemaConfig ? diff(this.origSchemaConfig, this.schemaConfig) : {};
        },
        diffsValid() {
            if (Object.keys(this.diffs).length <= 0) {
                return true;
            }
            for (const envObj of Object.values(this.diffs)) {
                for (const schemaArr of Object.values(envObj.entries)) {
                    // console.log(`id: ${id}`, schemaArr);
                    if (schemaArr.length <= 0) {
                        return false;
                    }
                }
            }
            return true;
        }
    },
    methods: {
        async refreshSchemaConfig() {
            this.errored = undefined;
            try {
                const [schemaConfig, allSchemas] = await Promise.all([
                    getBatchSchemaConfig(),
                    getSchemas()
                ]);
                this.allSchemas = allSchemas;
                this.schemaConfig = schemaConfig;
                this.origSchemaConfig = extend(true, {}, schemaConfig); // Deep copy it to save the original settings
            } catch (error) {
                console.error(`mounted: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
            } finally {
                this.loading = false;
                this.forceRerender();
            }
        },
        forceRerender() {
            this.componentKey += 1;
        },
        async onSubmit() {
            // console.log('onSubmit called!');
            this.updateSuccessful = undefined;
            // console.log(`DIFFS: ${JSON.stringify(this.diffs, undefined, 2)}`)
            try {
                // Make a copy so we can add the full filepath back to each env entries before sending to the server
                const diffCopy = extend(true, {}, this.diffs);
                for (const [env, envObj] of Object.entries(diffCopy)) {
                    envObj.schemaFileFP = this.origSchemaConfig[env].schemaFileFP;
                }
                // console.log(JSON.stringify(diffCopy, undefined, 2));
                const data = await updateBatchSchemaConfig(diffCopy);
                this.schemaConfig = data.schemaConfig;
                this.origSchemaConfig = extend(true, {}, data.schemaConfig); // Deep copy it to save the original settings
                this.updateSuccessful = data.successful;
            } catch (err) {
                console.error(`onSubmit: A promise(s) failed to resolve: ${err}`);
                this.updateSuccessful = false;
            }
        },
        onReset() {
            // console.log('onReset called!');
            this.updateSuccessful = undefined;
            this.refreshSchemaConfig();
        }
    },
    async mounted() {
        await this.refreshSchemaConfig();
        // this.instances.forEach(instance => {
        //     const envs = [...new Set(this.schemaConfig[instance].map(el => el.env))];
        //     const portfolios = [...new Set(this.schemaConfig[instance].map(el => el.portfolio))];
        //     console.log(envs);
        //     console.log(portfolios);
        //     this.$set(this.selectedEnvs, instance, envs);
        //     this.$set(this.selectedPortfolios, instance, portfolios);
        // });
        // console.log(this.selectedEnvs);
        // console.log(this.selectedPortfolios);
    }
}
</script>

<style lang="sass" scoped>

</style>
