<template>
    <q-card class="ear-card" bordered>
        <q-card-section :class="getHeaderCellBgClass()">
            <div class="text-h6">{{ jvm | toUpper }}</div>
        </q-card-section>

        <q-table
            :data="tbData"
            :columns="columns"
            row-key="ear"
            no-data-label="No data retrieved"
            :pagination.sync="pagination"
            dense
            hide-bottom
        >
            <!-- :expanded.sync="expandAll" -->
            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th auto-width :class="getHeaderCellBgClass()" />
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                    >
                        {{ col.label }}
                    </q-th>
                </q-tr>
            </template>
            <template v-slot:body="props">
                <q-tr
                    :props="props"
                    :class="jvm !== 'prod' ? calcCellBgClass(contents[props.key].againstProd) : ''"
                >
                    <q-td auto-width>
                        <q-btn
                            v-if="!expandAll"
                            size="sm"
                            color="primary"
                            dense
                            outline
                            @click="props.expand = !props.expand"
                            :icon="props.expand ? 'remove' : 'add'"
                        />
                    </q-td>
                    <q-td
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                    >
                        {{ col.value }}
                    </q-td>
                </q-tr>
                <template v-if="props.expand || expandAll">
                    <q-tr
                        v-for="(artObj, artifact) in sortLib(contents[props.key].lib)"
                        :key="artifact"
                        class="bg-grey-9"
                    >
                        <q-td auto-width />
                        <q-td colspan="2">
                            {{ artifact }}
                        </q-td>
                        <!-- <q-td auto-width /> -->
                        <q-td>
                            {{ artObj.checksum }}
                        </q-td>
                    </q-tr>
                </template>
            </template>
        </q-table>

    </q-card>
</template>

<script>
import compareVersionsUtil from 'compare-versions';

export default {
    props: {
        jvm: String,
        contents: Object,
        'disable-version-colors': Boolean,
        earFilterRx: String,
        expandAll: Boolean
        // tbData: undefined
    },
    data() {
        return {
            pagination: {
                sortBy: 'ear',
                descending: false,
                // page: 999,
                rowsPerPage: 0
                // rowsNumber: xx if getting data from a server
            },
            // cellBgClass: this.jvm === 'prod' ? 'bg-negative' : 'bg-primary',
            // cellBgClass: this.getHeaderCellBgClass(),
            columns: [
                {
                    name: 'ear',
                    required: true,
                    label: 'EAR',
                    align: 'left',
                    field: 'ear',
                    // format: val => `${val}`,
                    sortable: true,
                    classes: 'ellipsis',
                    // style: 'max-width: 100px',
                    headerClasses: this.getHeaderCellBgClass()
                },
                {
                    name: 'version',
                    required: true,
                    align: 'left',
                    label: 'Version',
                    field: 'version',
                    classes: 'ellipsis',
                    sortable: true,
                    // style: 'width: 250px',
                    sort: (a, b) => compareVersionsUtil(a, b),
                    headerClasses: this.getHeaderCellBgClass()
                },
                {
                    name: 'checksum',
                    required: true,
                    align: 'left',
                    label: 'CSum',
                    field: 'checksum',
                    sortable: true,
                    // style: 'width: 250px',
                    headerClasses: this.getHeaderCellBgClass()
                }
            ]
        }
    },
    computed: {
        filterRx() {
            return new RegExp(this.earFilterRx, 'i');
        },
        tbData() {
            const arr = [];
            for (const [ear, obj] of Object.entries(this.contents)) {
                if (!this.earFilterRx || this.filterRx.test(ear)) {
                    arr.push({
                        ear,
                        version: obj.earVersion,
                        checksum: obj.earChecksum
                    });
                }
            }
            this.$emit('earCountChanged', arr.length);
            return arr;
        }
    },
    // watch: {
    //     tbData(newTbData, oldTbData) {
    //         if (newTbData.length !== oldTbData.length) {
    //             console.log(`EMIT! ${newTbData.length}`);
    //             this.$emit('earCountChanged', newTbData.length);
    //         }
    //     }
    // },
    // mounted() {

    // },
    methods: {
        getHeaderCellBgClass() {
            return this.jvm === 'prod' ? 'bg-negative' : 'bg-primary';
        },
        calcCellBgClass(againstProd) {
            /* eslint-disable indent */
            switch(againstProd) {
                case 'UNKNOWN':
                    return 'bg-negative';
                case 'NEW':
                    return 'bg-accent';
                case 'BEHIND':
                    return 'bg-warning';
                case 'AHEAD':
                    return 'bg-positive';
                case 'SYNC':
                    return '';
                default:
                    return 'bg-negative';
            }
            /* eslint-enable indent */
        },
        sortLib(lib) {
            const orderedLib = {};
            // Case-sensitive sort, works out better for our stuff since Acxiom and S4 show up at the top
            Object.keys(lib).sort().forEach(key => {
                orderedLib[key] = lib[key];
            });
            return orderedLib;
        }
    }
}
</script>

<style lang="sass" scoped>
.ear-card
    width: 100%;
    max-width: 510px;
    th, td
        // margin: 0
    tr > :nth-child(2)
        font-weight: bold;
        width: 300px;
    tr > :nth-child(3)
        width: 100px;
    tr > :nth-child(4)
        width: 80px;
    // tr > :nth-child(2)
        // width: 70%;
</style>
