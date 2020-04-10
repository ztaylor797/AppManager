<template>
  <q-page>
    <!-- <p><pre>{{ JSON.stringify(diffs, undefined, 2) }}</pre></p> -->
    <h4>FDR Port/FID Configuration</h4>
    <p>
        Choose your new FDR configuration and click submit.
        <InfoBanner>Please note that this will perform a JVM restart within a minute.</InfoBanner>
    </p>
    <CommErrorBanner v-if="errored" />
    <div v-else class="q-py-md">
        <q-form
            @submit="onSubmit"
            @reset="onReset"
        >
            <div v-for="jvm in jvms" :key="jvm" class="q-mb-md row items-center q-gutter-md"> <!-- q-mb-sm q-pl-sm -->
                <span style="width: 120px; font-size: 1.5rem" class="text-white">{{ jvm | toUpper }}</span>
                <q-select outlined style="width: 10rem;" v-model="selected[jvm].fdrPort" :loading="loading" :options="ports" > <!-- style="max-width: 280px;"  @input="onChange" -->
                    <template v-slot:append>
                        <q-badge v-if="origSelected[jvm].fdrPort != selected[jvm].fdrPort" color="red">
                            Changed
                        </q-badge>
                    </template>
                </q-select>
                <q-select outlined style="width: 12rem;" v-model="selected[jvm].fdrFid" :loading="loading" :options="fids" > <!-- style="max-width: 280px;"  @input="onChange" -->
                    <template v-slot:append>
                        <q-badge v-if="origSelected[jvm].fdrFid != selected[jvm].fdrFid" color="red">
                            Changed
                        </q-badge>
                    </template>
                </q-select>
            </div>
            <div>
                <!-- <span style="width: 80px;"></span> -->
                <q-btn label="Submit" type="submit" icon-right="send" :disable="!changed" color="primary" style="margin-left: 136px"/>
                <q-btn label="Reset" type="reset" icon-right="undo" color="primary" flat class="q-ml-sm" />
            </div>
        </q-form>

        <q-inner-loading :showing="loading">
            <q-spinner-gears size="50px" color="primary" dark />
        </q-inner-loading>
    </div>

    <InfoBanner infoType="error" v-if="updateSuccessful === false">
        FDR config update was unsuccessful. Current settings on screen have been updated to live configuration.
    </InfoBanner>
    <InfoBanner infoType="positive" v-if="updateSuccessful === true">
        FDR config update was succesful! Please wait for it to reboot.
    </InfoBanner>
    <!-- <p>JVMS: {{ JSON.stringify(jvms,undefined,2) }}</p>
    <p>SCHEMAS: {{ JSON.stringify(schemas,undefined,2) }}</p> -->
  </q-page>
</template>

<script>
import InfoBanner from 'components/InfoBanner';
import CommErrorBanner from 'components/CommErrorBanner';
import { getJvms, getFdrOptions, getCurrentFdrConfig, updateFdrConfig } from '@/utils/api.js';
import { diff, areDiff } from '@/utils/objectUtilities.js';
import { extend } from 'quasar'; // Deep copy util

export default {
    name: 'FDRConfig',
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
            ports: [],
            fids: [],
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
        }
    },
    methods: {
        async onSubmit() {
            // console.log('onSubmit called!');
            this.updateSuccessful = undefined;
            // console.log(`DIFFS: ${JSON.stringify(this.diffs, undefined, 2)}`)
            try {
                const data = await updateFdrConfig(this.diffs);
                const newSelected = data.currFdrConfig;
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
            const [jvms, fdrOptions, selected] = await Promise.all([
                getJvms(),
                getFdrOptions(),
                getCurrentFdrConfig()
                // new Promise(resolve => setTimeout(resolve, 3000))
            ]);
            // console.log('Selected = ' + JSON.stringify(selected, undefined, 2));
            this.jvms = jvms;
            this.ports = fdrOptions.ports;
            this.fids = fdrOptions.fids;
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
