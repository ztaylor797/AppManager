<template>
    <q-page>
        <h4>JVM Properties Contents</h4>
        <CommErrorBanner v-if="errored" />
        <div v-else>
            <!-- <pre>{{ JSON.stringify(allPropContents, undefined, 2) }}</pre> -->
            <div class="row q-gutter-md">
                <template v-for="(jvmArr, jvm) in allPropContents">
                    <q-markup-table :key="jvm" class="text-left" wrap-cells dense style="width: 100%">
                        <thead class="bg-primary">
                            <tr>
                                <th colspan="2">
                                    <span style="font-size: 1.5rem;">{{ jvm | toUpper }}</span>
                                </th>
                            </tr>
                            <tr>
                                <th>Properties File</th>
                                <th>Masked Contents</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="obj in jvmArr" :key="obj.file">
                                <td class="text-weight-bold">{{ obj.file }}</td>
                                <td style="white-space: pre-line; word-break: break-all;">{{ obj.contents }}</td>
                            </tr>
                        </tbody>
                    </q-markup-table>
                </template>
            </div>
            <q-inner-loading :showing="loading">
                <q-spinner-gears size="50px" color="primary" dark />
            </q-inner-loading>
        </div>
    </q-page>
</template>

<script>
import CommErrorBanner from 'components/CommErrorBanner';
import { getPropertiesContents } from '@/utils/api.js';

export default {
    name: 'PropertiesContents',
    components: {
        CommErrorBanner
    },
    data () {
        return {
            loading: true,
            errored: false,
            allPropContents: undefined
        }
    },
    methods: {
        async refreshAllPropContents() {
            try {
                this.allPropContents = await getPropertiesContents();
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
        this.refreshAllPropContents();
    }
}
</script>
