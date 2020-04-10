<template>
  <q-page>
    <h4>DB Schema Configuration</h4>
    <p>
        Choose your new schema configuration and click submit.
        <InfoBanner>Please note that this will perform a JVM restart within a minute.</InfoBanner>
    </p>
    <CommErrorBanner v-if="errored" />
    <div v-else class="q-py-md" style="max-width: 400px">

        <q-form
            @submit="onSubmit"
            @reset="onReset"
            class="q-gutter-md"
        >
            <div v-for="jvm in jvms" :key="jvm" class="q-mb-sm"> <!-- q-mb-sm q-pl-sm -->
                <q-select outlined v-model="selected[jvm]" :loading="loading" :options="schemas" > <!-- style="max-width: 280px;"  @input="onChange" -->
                    <template v-slot:before>
                        <span style="width: 100px;" class="text-white">{{ jvm | toUpper }}</span>
                    </template>
                    <template v-slot:append>
                        <q-badge v-if="origSelected[jvm] != selected[jvm]" color="red">
                            Changed
                        </q-badge>
                    </template>
                </q-select>
            </div>
            <div>
                <!-- <span style="width: 80px;"></span> -->
                <q-btn label="Submit" type="submit" icon-right="send" :disable="!changed || !changedJvmsAreRunning" color="primary" style="margin-left: 111px"/>
                <q-btn label="Reset" type="reset" icon-right="undo" color="primary" flat class="q-ml-sm" />
            </div>
        </q-form>

        <q-inner-loading :showing="loading">
            <q-spinner-gears size="50px" color="primary" dark />
        </q-inner-loading>
    </div>

    <InfoBanner infoType="warn" v-if="changed && !changedJvmsAreRunning">
        One or more of the changed JVMs are offline or unreachable. They must be online in order to update them. Please wait for them to reboot or trigger a new reboot before using this page again.
    </InfoBanner>
    <InfoBanner infoType="error" v-if="updateSuccessful === false">
        Schema update was unsuccessful. Current settings on screen have been updated to live configuration.
    </InfoBanner>
    <InfoBanner infoType="positive" v-if="updateSuccessful === true">
        Schema update was succesful! Please wait for it to reboot.
    </InfoBanner>
    <!-- <p>JVMS: {{ JSON.stringify(jvms,undefined,2) }}</p>
    <p>SCHEMAS: {{ JSON.stringify(schemas,undefined,2) }}</p> -->
  </q-page>
</template>

<script>
import InfoBanner from 'components/InfoBanner';
import CommErrorBanner from 'components/CommErrorBanner';
import { getJvms, getSchemas, getCurrentJvmSchemas, updateJvmSchemas } from '@/utils/api.js';
import { diff, areDiff } from '@/utils/objectUtilities.js';
import { extend } from 'quasar'; // Deep copy util

export default {
    name: 'DBConfig',
    components: {
        InfoBanner,
        CommErrorBanner
    },
    data () {
        return {
            loading: true,
            errored: false, // used in mounted() initial page load
            updateSuccessful: undefined, // used for determining update result after form submit
            jvms: [],
            schemas: [],
            origSelected: { },
            selected: { }
        };
    },
    computed: {
        changed() {
            return areDiff(this.selected, this.origSelected);
        },
        diffs() {
            return diff(this.origSelected, this.selected);
        },
        changedJvmsAreRunning() {
            // If any JVM is not in running or online state, return false. The CLI is used to update the schema and pass so it has to be online for this update to work.
            for (const jvm of Object.keys(this.diffs)) {
                if (!this.jvmStates[jvm] || !this.jvmStates[jvm].match(/RUNNING|ONLINE/i)) {
                    return false;
                }
            }
            return true;
        },
        jvmStates() {
            return this.$store.state.jvmStates;
        }
    },
    methods: {
        async onSubmit() {
            // console.log('onSubmit called!');
            this.updateSuccessful = undefined;
            // console.log(`DIFFS: ${JSON.stringify(this.diffs, undefined, 2)}`)
            try {
                const data = await updateJvmSchemas(this.diffs);
                const newSelected = data.currJvmSchemas;
                this.updateSuccessful = data.successful;
                this.selected = newSelected;
                // Deep copy newSelected object into new {} object
                this.origSelected = extend(true, {}, newSelected);
            } catch (err) {
                console.error(`onSubmit: A promise(s) failed to resolve: ${err}`);
                this.updateSuccessful = false;
            }
        },
        onReset() {
            // console.log('onReset called!');
            this.jvms.forEach(jvm => {
                this.$set(this.selected, jvm, this.origSelected[jvm]);
            });
            this.updateSuccessful = undefined;
        }
    },
    async mounted() {
        try {
            // Run these methods in parallel, then once both complete, we can set loading to false in finally block
            const [jvms, schemas, selected] = await Promise.all([
                getJvms(),
                getSchemas(),
                getCurrentJvmSchemas()
                // new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            // console.log(JSON.stringify(selected, undefined, 2));
            this.jvms = jvms;
            this.schemas = schemas;
            this.selected = selected;
            // this.origSelected = JSON.parse(JSON.stringify(selected));
            // Deep copy selected object into new {} object
            this.origSelected = extend(true, {}, selected);

            // console.log(`Obtained: ${jvms.length} ${schemas.length}`);
        } catch (err) {
            console.error(`mounted: A promise(s) failed to resolve: ${err}`);
            this.errored = true;
        } finally {
            this.loading = false;
        }
    }
}
</script>
