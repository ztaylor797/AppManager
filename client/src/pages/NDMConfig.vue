<template>
    <q-page>
        <h4>S4 NDM Configuration</h4>
        <p>
        <InfoBanner>This information is defined manually and will need to be updated in the future if it changes.</InfoBanner>
        </p>

        <div class="row items-start q-gutter-md">
            <q-card class="ndm-card" bordered
                v-for="entry in ndm"
                :key="entry.node"
            >
                <q-card-section :class="entry.env === 'prod' ? 'bg-negative' : 'bg-primary'">
                    <div class="text-h6">{{ entry.env === 'prod' ? 'Production Settings' : 'QA Settings' }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section style="white-space: pre-line; word-break: break-all; padding: 0">
                    <q-markup-table dense square flat class="text-left ndm-table">
                        <tbody>
                            <tr v-for="(value, key) in entry" :key="key">
                                <td class='text-weight-bold'>{{ key | toUpper }}</td>
                                <td>{{ value }}</td>
                            </tr>
                        </tbody>
                    </q-markup-table>
                </q-card-section>
            </q-card>
        </div>
    </q-page>
</template>

<script>
import InfoBanner from 'components/InfoBanner';

export default {
    name: 'NDMConfig',
    components: { InfoBanner },
    data () {
        return {
            ndm: [
                {
                    node: 's4prod10',
                    env: 'prod',
                    'secure+': 'yes',
                    ip: '139.61.250.28',
                    port: '1364'
                },
                {
                    node: 's4qa',
                    env: 'qa',
                    'secure+': 'no',
                    ip: '139.61.250.27',
                    port: '1364'
                }
            ]
        }
    }
}
</script>

<style lang="sass" scoped>
.ndm-card
    width: 100%;
    max-width: 400px;
    tr > :nth-child(1)
        width: 30%;
.ndm-table
    width: 100%;
</style>
