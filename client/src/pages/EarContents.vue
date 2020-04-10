<template>
    <q-page>
        <h4>EAR Contents</h4>
        <CommErrorBanner v-if="errored" />
        <div v-else>

            <!-- <pre>{{ JSON.stringify(earCounts, undefined, 2) }}</pre> -->
            <!-- <h3>Opts: {{ JSON.stringify(jvmOptions, undefined, 2) }}</h3>
            <h3>Sel: {{ selectedJvms }}</h3> -->
            <!-- <h3>{{ maxEarsInJvm }}</h3> -->

            <div class="row q-gutter-md">
                <q-badge color="positive" label="Ahead of prod" />
                <q-badge color="accent" label="New/Not in prod" />
                <q-badge color="warning" label="Behind prod" />
                <q-badge color="negative" label="Unknown" />
                <!-- <div class="q-gutter-md" style="max-width: 400px"> -->
                <!-- </div> -->
            </div>

            <div class="row q-gutter-xs items-end q-mb-md">
                <q-input v-model="earFilterRx" label="EAR Filter Regex" clearable class="regex" debounce="1000" />
                <q-toggle
                    class="q-ml-sm"
                    size="lg"
                    v-model="expandAll"
                    val="xl"
                    label="Expand All"
                    :disable="maxEarsInJvm > 1"
                    keep-color
                    :color="maxEarsInJvm > 1 ? 'negative' : 'primary'"
                >
                    <q-tooltip v-if="maxEarsInJvm > 1" content-class="bg-negative" content-style="font-size: .75rem;">
                        Narrow the number of EARs down to 1 using the regex filter before trying to expand all (for browser performance).
                    </q-tooltip>
                </q-toggle>
            </div>

            <div class="row q-gutter-lg items-center q-mb-md">
                <q-option-group
                    v-if="jvmOptions"
                    v-model="selectedJvms"
                    :options="jvmOptions"
                    color="primary"
                    type="checkbox"
                    inline
                    class="q-ml-sm"
                />
                <q-btn v-if="jvms.length > 0"
                    size="sm" dense
                    :icon="allSelected ? 'indeterminate_check_box' : 'library_add_check'"
                    :color="allSelected ? 'warning' : 'positive'"
                    @click="toggleSelectAll"
                >
                    &nbsp;{{ allSelected ? 'Deselect All' : 'Select All' }}
                </q-btn>
            </div>

            <div class="row items-start q-gutter-md">
                <EarContentsCard v-for="(contents, jvm) in filteredQa"
                    :key="jvm"
                    :jvm="jvm"
                    :contents="contents"
                    :earFilterRx="earFilterRx"
                    :expandAll="expandAll"
                    @earCountChanged="$set(earCounts, jvm, $event)"
                />
                <!-- v-if is important here since prodContents starts out undefined -->
                <EarContentsCard
                    v-if="prodContents && selectedJvms.includes('prod')"
                    key="prod"
                    jvm="prod"
                    disable-version-colors
                    :contents="prodContents"
                    :earFilterRx="earFilterRx"
                    :expandAll="expandAll"
                    @earCountChanged="$set(earCounts,'prod', $event)"
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
import EarContentsCard from 'components/EarContentsCard';
import { getEarContents } from '@/utils/api.js';

export default {
    name: 'EarContents',
    components: {
        CommErrorBanner,
        EarContentsCard
    },
    data () {
        return {
            loading: true,
            errored: false,
            allEarContents: undefined,
            earFilterRx: '',
            expandAll: false,
            earCounts: {},
            selectedJvms: []
            // expanded: false,
            // interval: undefined,
            // now: undefined
        }
    },
    computed: {
        qa() {
            if (!this.allEarContents || !this.allEarContents.qa) {
                return undefined;
            }
            return this.allEarContents.qa;
        },
        filteredQa() {
            if (!this.qa) {
                return undefined;
            }
            return Object.keys(this.qa)
                .filter(jvm => this.selectedJvms.includes(jvm))
                .reduce((obj, jvm) => {
                    obj[jvm] = this.qa[jvm];
                    return obj;
                }, {});
        },
        prodContents() {
            if (!this.allEarContents || !this.allEarContents.prod) {
                return undefined;
            }
            return this.allEarContents.prod;
        },
        jvms() {
            if (this.qa) {
                return [...Object.keys(this.qa), 'prod'];
            } else {
                return [];
            }
        },
        jvmOptions() {
            if (this.jvms.length > 0) {
                return this.jvms.map(jvm => {
                    const obj = { label: jvm.toUpperCase(), value: jvm };
                    if (jvm === 'prod') {
                        obj.color = 'negative';
                    }
                    return obj;
                });
            }
            return undefined;
        },
        maxEarsInJvm() {
            const filteredEarCounts = Object.keys(this.earCounts)
                .filter(jvm => this.selectedJvms.includes(jvm))
                .reduce((arr, jvm) => {
                    arr.push(this.earCounts[jvm]);
                    return arr;
                }, []);
            return Math.max(...filteredEarCounts);
        },
        allSelected() {
            return this.jvms.length === this.selectedJvms.length;
        }
    },
    watch: {
        // Disable expansion if the regex changes and we have more ears on screen
        maxEarsInJvm(newVal) {
            if (newVal > 1) {
                this.expandAll = false;
            }
        }
    },
    methods: {
        async refreshEarContents() {
            try {
                this.allEarContents = await getEarContents();
            } catch (error) {
                console.error(`mounted: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
            } finally {
                this.loading = false;
            }
        },
        toggleSelectAll() {
            if (this.allSelected) {
                this.selectedJvms = [];
            } else {
                const arr = [];
                this.jvms.forEach(jvm => arr.push(jvm));
                this.selectedJvms = arr;
            }
        }
    },
    async mounted() {
        await this.refreshEarContents();
        const jvms = [...Object.keys(this.qa), 'prod'];
        jvms.forEach(jvm => this.selectedJvms.push(jvm));
    }
}
</script>

<style lang="sass" scoped>
.regex
    width: 100%;
    max-width: 510px;
</style>
