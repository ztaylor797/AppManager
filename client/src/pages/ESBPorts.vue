<template>
  <q-page>
    <h4>ESB Port Configuration</h4>
    <!-- <pre>{{ JSON.stringify(jvmSchemaMap, undefined, 2) }}</pre> -->
    <p>
        Choose your new port configuration and click submit. JVMs in <span class="text-primary text-bold">color</span> are pointed at that DB schema.
        <InfoBanner>Please note that this will perform a JVM restart within a minute IF the JVM is pointed at the schema's port you update below. If your expected port is missing, please email ccsi_304_s4@acxiom.com.</InfoBanner>
    </p>
    <CommErrorBanner v-if="errored" />
    <div v-else>

        <q-form
            @submit="onSubmit"
            @reset="onReset"
            class="row items-start q-gutter-md"
        >
            <q-card class="esb-card" bordered
                v-for="schema in schemas"
                :key="schema"
            >
                <q-card-section class="bg-primary">
                    <div class="text-h6">{{ schema | toUpper }}</div>
                </q-card-section>

                <q-card-section>
                    <div v-for="jvm in jvms" :key="jvm" class="q-mb-sm">
                        <q-select outlined v-model="currPorts[schema][jvm]" :loading="loading" :options="allPorts" >
                            <template v-slot:before>
                                <span style="width: 90px;" class="text-subtitle1" :class="jvmSelClass(jvm, schema)">{{ jvm | toStandardJvmFormat }}</span>
                            </template>
                            <template v-slot:append>
                                <q-badge v-if="origSelected[schema][jvm] != currPorts[schema][jvm]" color="red">
                                    Changed
                                </q-badge>
                            </template>
                        </q-select>
                    </div>
                </q-card-section>
            </q-card>

            <div class="col-12">
                <q-btn label="Submit" type="submit" icon-right="send" :disable="!changed" color="primary"/>
                <q-btn label="Reset" type="reset" icon-right="undo" color="primary" flat class="q-ml-sm" />
            </div>
        </q-form>

        <!-- <p class="q-mt-lg">Schemas: {{ schemas }}</p>
        <p><pre>changed: {{ changed }}</pre></p>
        <p><pre>DIFFs: {{ diffs }}</pre></p>
        <p><pre>JVMs: {{ jvms }}</pre></p>
        <p><pre>currPorts: {{ currPorts }}</pre></p>
        <p><pre>origSelected: {{ origSelected }}</pre></p>
        <p><pre>allPorts: {{ allPorts }}</pre></p> -->

        <q-inner-loading :showing="loading">
            <q-spinner-gears size="50px" color="primary" dark />
        </q-inner-loading>
    </div>

    <InfoBanner infoType="error" v-if="updateSuccessful === false">
        Port update was unsuccessful. Current settings on screen have been updated to live configuration.
    </InfoBanner>
    <InfoBanner infoType="positive" v-if="updateSuccessful === true">
        Port update was succesful! Please wait for it to reboot.
    </InfoBanner>
  </q-page>
</template>

<script>
import InfoBanner from 'components/InfoBanner';
import CommErrorBanner from 'components/CommErrorBanner';
import { getEsbPorts, updateEsbPorts, getCurrentJvmSchemas } from '@/utils/api.js';
import { diff, areDiff } from '@/utils/objectUtilities.js';
import { extend } from 'quasar'; // Deep copy util

const compNums = (a, b) => a - b;

export default {
    name: 'ESBPorts',
    components: {
        InfoBanner,
        CommErrorBanner
    },
    data () {
        return {
            loading: true,
            errored: false, // used in mounted() initial page load
            updateSuccessful: undefined, // used for determining update result after form submit
            allPorts: [],
            currPorts: { },
            origSelected: { },
            selected: { },
            jvmSchemaMap: { }
        };
    },
    computed: {
        schemas() {
            return Object.keys(this.currPorts).sort();
        },
        jvms() {
            const jvmArr = Object.values(this.currPorts).reduce((res, schemaObj) => {
                return [...res, ...Object.keys(schemaObj)];
            }, []);
            // This dedups the array entries and then sorts
            return [...new Set(jvmArr)].sort();
        },
        changed() {
            return areDiff(this.currPorts, this.origSelected);
        },
        diffs() {
            return diff(this.origSelected, this.currPorts);
        }
    },
    methods: {
        async onSubmit() {
            // console.log('onSubmit called!');
            this.updateSuccessful = undefined;
            // console.log(`DIFFS: ${JSON.stringify(this.diffs, undefined, 2)}`)
            try {
                const data = await updateEsbPorts(this.diffs);
                const esbPortData = data.esbPortData;
                const newCurrPorts = esbPortData.currPorts;
                this.updateSuccessful = data.successful;
                this.currPorts = newCurrPorts;
                // Deep copy newSelected object into new {} object
                this.origSelected = extend(true, {}, newCurrPorts);
            } catch (err) {
                console.error(`onSubmit: A promise(s) failed to resolve: ${err}`);
                this.updateSuccessful = false;
            }
        },
        onReset() {
            // console.log('onReset called!');
            this.schemas.forEach(schema => {
                this.jvms.forEach(jvm => {
                    this.$set(this.currPorts[schema], jvm, this.origSelected[schema][jvm]);
                });
            });
            this.updateSuccessful = undefined;
        },
        jvmSelClass(jvm, schema) {
            const shortJvm = jvm.replace('_jvm', '');
            // console.log(shortJvm);
            if (this.jvmSchemaMap[shortJvm] && this.jvmSchemaMap[shortJvm] === schema) {
                return { 'text-primary': true };
            } else {
                return { 'text-white': true };
            }
        }
    },
    async mounted() {
        try {
            const esbPortData = await getEsbPorts();
            this.esbPortData = esbPortData;
            this.currPorts = esbPortData.currPorts;
            this.allPorts = esbPortData.allPorts.sort(compNums); // Sort numerically
            // this.jvms = jvms;
            // this.schemas = schemas;
            // this.selected = selected;

            // Deep copy selected object into new {} object
            this.origSelected = extend(true, {}, this.currPorts);

            // console.log(`Obtained: ${jvms.length} ${schemas.length}`);
        } catch (err) {
            console.error(`mounted: A promise(s) failed to resolve: ${err}`);
            this.errored = true;
        } finally {
            this.loading = false;
        }

        try {
            this.jvmSchemaMap = await getCurrentJvmSchemas();
        } catch (err) {
            console.error(err);
        }
    },
    filters: {
        toStandardJvmFormat: function (jvm) {
            if (!jvm) return '';
            jvm = jvm.toString()
            return jvm.replace('_jvm', '');
        }
    }
}
</script>

<style lang="sass" scoped>
.esb-card
    width: 100%;
    max-width: 300px;
    tr > :nth-child(1)
        font-weight: bold;
    // tr > :nth-child(2)
    //     width: 70%;
</style>
