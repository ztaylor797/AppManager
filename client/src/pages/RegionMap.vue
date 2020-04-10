<template>
    <q-page>
        <h4>S4 Citi to Acxiom Region Map</h4>
        <p>
            <InfoBanner>This information is defined manually and will need to be updated in the future if it changes.</InfoBanner>
        </p>

        <!-- <q-card class="ndm-card" bordered>
            <q-card-section class="bg-primary">
                <div class="text-h6"></div>
            </q-card-section>
            <q-separator /> -->
        <!-- <q-card-section style="white-space: pre-line; word-break: break-all; padding: 0"> -->
        <q-markup-table bordered flat class="region-table text-left">
            <thead class="bg-primary">
                <tr>
                    <th>Citi Region</th>
                    <th>Acxiom JVM</th>
                    <th>Acxiom Batch Env</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(obj, citiRegion) in regionMap" :key="citiRegion">
                    <td class="text-weight-bold">{{ citiRegion }}</td>
                    <td>{{ obj.acxiomJvm }}</td>
                    <td>{{ obj.acxiomBatchEnv }}</td>
                </tr>
            </tbody>
        </q-markup-table>
            <!-- </q-card-section>
        </q-card> -->
    </q-page>
</template>

<script>
import InfoBanner from 'components/InfoBanner';

export default {
    name: 'NDMConfig',
    components: { InfoBanner },
    data () {
        return {
            regionMap: {
                A: { acxiomBatchEnv: 'sitA', acxiomJvm: 'sit1' },
                B: { acxiomBatchEnv: 'uatB', acxiomJvm: 'uat1' },
                D: { acxiomBatchEnv: 'uatD', acxiomJvm: 'uat2' },
                E: { acxiomBatchEnv: 'sitE', acxiomJvm: 'sit2' },
                G: { acxiomBatchEnv: '-', acxiomJvm: 'agile1' },
                H: { acxiomBatchEnv: '-', acxiomJvm: 'agile2' }
            }
        }
    }
}
</script>

<style lang="sass" scoped>
.region-table
    width: 100%;
    max-width: 350px;

    td
        font-size: 1.5rem;

    tr > :nth-child(1)
        width: 20%;
        text-align: center;
// .region-table
//     width: 100%;
</style>
