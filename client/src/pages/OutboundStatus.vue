<template>
    <q-page>
        <!-- <h4 id='outbound-status-heading'>Outbound Status</h4> -->
        <CommErrorBanner v-if="errored" />
        <div v-else>
            <p id='outbound-status-heading'>
                <InfoBanner>Telnet status is a simple telnet connectivity check.</InfoBanner>
                <InfoBanner>SOAP status performs a test soap request via curl. Invalid likely means that it timed out (timeout = 2000 ms).</InfoBanner>
            </p>
            <!-- <pre>{{ JSON.stringify(outboundStatus, undefined, 2) }}</pre> -->
            <!-- Using the title attribute on q-table breaks the sizing of the page, don't do it -->
            <q-table
                :data="outboundStatus"
                :columns="columns"
                title="Outbound Status"
                row-key="env"
                no-data-label="No data retrieved"
                :pagination.sync="pagination"
                class="sticky-header-table"
                hide-bottom
                :table-style="{ maxHeight: height }"
                :loading="loading"
            >
                <template v-slot:body-cell-env="props">
                    <q-td :props="props"
                        class="text-weight-bold"
                    >
                        <div>
                            {{ props.value }}
                        </div>
                    </q-td>
                </template>
                <template v-slot:body-cell-soapStatus="props">
                    <q-td :props="props"
                        :class="calcCellBgClass(props.row.soapStatus)"
                    >
                        <div>
                            <!-- TODO add calc'ed icon here -->
                            {{ props.value }}
                        </div>
                    </q-td>
                </template>
                <template v-slot:body-cell-telnetStatus="props">
                    <q-td :props="props"
                        :class="calcCellBgClass(props.row.telnetStatus)"
                    >
                        <div>
                            <!-- TODO add calc'ed icon here -->
                            {{ props.value }}
                        </div>
                    </q-td>
                </template>
                <template v-slot:top-right>
                    <q-btn
                    color="primary"
                    icon-right="archive"
                    label="Export to csv"
                    no-caps
                    @click="exportTable"
                    />
                </template>
            </q-table>
            <q-inner-loading :showing="loading">
                <q-spinner-gears size="50px" color="primary" dark />
            </q-inner-loading>
        </div>
        <q-resize-observer @resize="onResize" />
    </q-page>
</template>

<script>
import CommErrorBanner from 'components/CommErrorBanner';
import InfoBanner from 'components/InfoBanner';
// import JVMInfoCard from 'components/JVMInfoCard';
import { getOutboundStatus } from '@/utils/api.js';

import { exportFile, dom, date } from 'quasar';
const { height } = dom;

function getFormattedNow() {
    const timeStamp = Date.now()
    const formattedString = date.formatDate(timeStamp, 'YYYYMMDD_HHmmss');
    return formattedString;
}

function wrapCsvValue (val, formatFn) {
    let formatted = formatFn !== undefined
        ? formatFn(val)
        : val;

    formatted = formatted === undefined || formatted === null
        ? ''
        : String(formatted);

    formatted = formatted.split('"').join('""')
    /**
     * Excel accepts \n and \r in strings, but some other CSV parsers do not
     * Uncomment the next two lines to escape new lines
     */
    // .split('\n').join('\\n')
    // .split('\r').join('\\r')

    return `"${formatted}"`
}

export default {
    name: 'OutboundStatus',
    components: {
        CommErrorBanner,
        InfoBanner
    },
    data () {
        return {
            loading: true,
            errored: false,
            height: -1,
            outboundStatus: undefined,
            pagination: {
                sortBy: 'type',
                descending: false,
                page: 0,
                rowsPerPage: 0
            },
            columns: [
                {
                    name: 'type',
                    required: true,
                    label: 'Type',
                    align: 'left',
                    field: 'type',
                    sortable: true
                },
                {
                    name: 'env',
                    required: true,
                    label: 'Env',
                    align: 'left',
                    field: 'env',
                    sortable: true
                },
                {
                    name: 'nsPort',
                    required: true,
                    label: 'NS Port',
                    align: 'left',
                    field: 'nsPort',
                    sortable: true
                },
                {
                    name: 'remoteIp',
                    required: true,
                    label: 'Remote IP',
                    align: 'left',
                    field: 'remoteIp',
                    sortable: true
                },
                {
                    name: 'remotePort',
                    required: true,
                    label: 'Remote Port',
                    align: 'left',
                    field: 'remotePort',
                    sortable: true
                },
                {
                    name: 'soapStatus',
                    required: true,
                    label: 'SOAP Status',
                    align: 'left',
                    field: 'soapStatus',
                    sortable: true
                },
                {
                    name: 'telnetStatus',
                    required: true,
                    label: 'Telnet Status',
                    align: 'left',
                    field: 'telnetStatus',
                    sortable: true
                }
            ]
        }
    },
    methods: {
        async refreshOutboundStatus() {
            try {
                this.outboundStatus = await getOutboundStatus();
                // console.log(JSON.stringify(this.jvmInfo.uat1, undefined, 2));
            } catch (error) {
                console.error(`mounted: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
            } finally {
                this.loading = false;
            }
        },
        calcCellBgClass(status) {
            /* eslint-disable indent */
            switch(status) {
                case 'VALID':
                case 'UP':
                    return 'bg-positive';
                case 'DOWN':
                case 'UNREACHABLE':
                case 'TIMEOUT':
                    return 'bg-negative';
                case 'INVALID':
                    return 'bg-warning';
                default:
                    return ''
            }
            /* eslint-enable indent */
        },
        onResize (size) {
            // This mess uses the Quasar resizeObserver to notify when the dimensions of the page change and on initial load. At that point, we calculate the height of the page content and subtract the 'height of the heading above the table' from it. That is the new max height of our table. This is so we can have a fixed table area with sticky header record. There's probably some simple way to do this with Quasar layouts, but I can't figure it out. I hated this.
            const contentDomElement = document.getElementsByTagName('main')[0].firstChild.firstChild;
            const headingDomElement = document.getElementById('outbound-status-heading');
            const heightVal = height(contentDomElement) - height(headingDomElement) - 85;
            this.height = `${heightVal}px`;
        },
        exportTable () {
            // naive encoding to csv format
            const content = [this.columns.map(col => wrapCsvValue(col.label))].concat(
                this.outboundStatus.map(row => this.columns.map(col => wrapCsvValue(
                    typeof col.field === 'function'
                        ? col.field(row)
                        : row[col.field === undefined ? col.name : col.field],
                    col.format
                )).join(','))
            ).join('\r\n');

            const status = exportFile(
                `outbound_status_${getFormattedNow()}.csv`,
                content,
                'text/csv'
            );

            if (status !== true) {
                this.$q.notify({
                    message: 'Browser denied file download...',
                    color: 'negative',
                    icon: 'warning'
                });
            }
        }
    },
    async mounted() {
        this.refreshOutboundStatus();
    }
}
</script>

<style lang="sass">
.sticky-header-table
    /* height or max-height is important, setting it dynamically view onResize() */
    // max-height: calc(100vh);
    // max-height: 100%;
    max-width: 1000px;

    .q-table__top,
    .q-table__bottom,
    thead tr:first-child th
        /* bg color is important for th; just specify one */
        background-color: $primary

    thead tr th
        position: sticky
        z-index: 1
        margin-top: 0
        padding-top: 0
    thead tr:first-child th
        top: 0

    /* this is when the loading indicator appears */
    &.q-table--loading thead tr:last-child th
        /* height of all previous header rows */
        top: 48px
</style>
