// This component is just a generic server communication error so we only have to change that text in one place
<template>
    <InfoBanner infoType="error">
        Unable to communicate with the server.&nbsp;
        <span v-if="!isProduction">(Dev: Please make sure you have appropriate tunnels enabled for API connectivity. Also try navigating to that URL manually to resolve the SSL exception if it has been a while since you last tried it.)</span>
    </InfoBanner>
</template>

<script>
import InfoBanner from 'components/InfoBanner';

export default {
    components: {
        InfoBanner
    },
    computed: {
        isProduction() {
            return process.env.isProduction;
        }
    }
}
</script>
