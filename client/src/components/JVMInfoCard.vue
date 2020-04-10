<template>
    <q-card class="jvm-card" bordered>
        <q-card-section :class="bgColor">
            <div class="text-h6">{{ jvm | toUpper }}</div>

        </q-card-section>

        <q-markup-table>
            <!-- <thead>
                <tr>
                    <th class="text-left">Start Time</th>
                </tr>
            </thead> -->
            <tbody>
                <tr>
                    <td>State</td>
                    <td>
                        <span v-if="state === 'BOOTING' || state === 'DEPLOYING'">
                            <q-spinner-gears
                                color="info"
                                size="1.5rem"
                                class="q-mr-sm"
                            />
                        </span>
                        <q-icon v-else
                            :name="iconName"
                            :color="color"
                            size="1rem"
                            class="q-mr-sm"
                        />
                        {{ state }}
                    </td>
                </tr>
                <tr v-for="(value, key) in tableEntries" :key="key">
                    <td>{{ key }}</td>
                    <td>{{ value }}</td>
                </tr>
                <template v-if="expanded">
                    <tr v-for="(value, key) in optTableEntries" :key="key">
                        <td>{{ key }}</td>
                        <td>{{ value }}</td>
                    </tr>
                </template>
                <tr @click="toggleExpanded" class="cursor-pointer">
                    <td class="text-primary">{{ expandText }} Details</td>
                    <td>
                        <q-icon color="primary" size="2rem" :name="expandIcon" />
                    </td>
                </tr>
            </tbody>
        </q-markup-table>
    </q-card>
</template>

<script>
import { date } from 'quasar';
import { getStateDisplayProperties } from '../utils/jvmStateUtilities';

export default {
    // "now" is updated via a one second interval in JVMInfo
    props: {
        jvm: [String],
        info: Object,
        expanded: Boolean,
        now: Date
    },
    data() {
        return {
            // now: undefined
        };
    },
    computed: {
        // allStates() {
        //     return this.$store.state.jvmStates;
        // },
        expandText() {
            return this.expanded ? 'Hide' : 'Show';
        },
        expandIcon() {
            return this.expanded ? 'expand_less' : 'expand_more';
        },
        tableEntries() {
            // Programatically invoke vue filter (from filters.js in /boot)
            const filters = this.$options.filters;

            // Note "State" is not included in this list because we do some special rendering on it, see template above
            return {
                'Start Time': filters.epochMSToPretty(this.info.startupTsMs),
                Uptime: filters.durationToReadable(this.uptime),
                'Internal Port': this.info.intPort,
                'External NS Port': this.info.extPort,
                Schema: this.info.schema,
                'Log Path': this.info.logPath
            };
        },
        optTableEntries() {
            // Multiple gtm entries per field so have to do some nested logic
            const gtmAddins = {};
            for (const [type, obj] of Object.entries(this.info.gtm)) {
                gtmAddins[`GTM FID ${type.toUpperCase()}`] = obj.gtmFid;
                gtmAddins[`GTM Port ${type.toUpperCase()}`] = obj.gtmPort;
            }

            return {
                'FiServ FID': this.info.fdrFid,
                'FiServ Port': this.info.fdrPort,
                ...gtmAddins,
                'CU Port': this.info.cuPort
            };
        },
        state() {
            return this.$store.getters.singlejvmState(this.jvm);
            // if (this.allStates) {
            //     if (this.jvm in this.$store.state.jvmStates) {
            //         return this.$store.state.jvmStates[this.jvm];
            //     } else {
            //         return undefined;
            //     }
            // } else {
            //     return undefined;
            // }
        },
        displayProps() {
            return getStateDisplayProperties(this.state);
        },
        iconName() {
            if (this.displayProps) {
                return this.displayProps.iconName;
            } else {
                return '';
            }
        },
        color() {
            if (this.displayProps) {
                return this.displayProps.color;
            } else {
                return 'grey-6';
            }
        },
        bgColor() {
            if (this.state === 'ONLINE') {
                return 'bg-primary';
            } else {
                return `bg-${this.color}`;
            }
        },
        uptime() {
            if (!this.info.startupTsMs) {
                return '';
            }
            if (this.state === 'OFFLINE') {
                return 'N/A';
            }
            const start = new Date(this.info.startupTsMs);
            const diff = date.getDateDiff(this.now, start, 'seconds');
            return diff;
        }
    },
    methods: {
        toggleExpanded() {
            this.$emit('toggleExpanded');
        }
    }
}
</script>

<style lang="sass" scoped>
.jvm-card
    width: 100%;
    max-width: 400px;
    tr > :nth-child(1)
        font-weight: bold;
    tr > :nth-child(2)
        width: 70%;
</style>
