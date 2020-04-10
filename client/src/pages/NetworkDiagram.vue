<template>
    <q-page>
        <CommErrorBanner v-if="errored" />
        <q-pdfviewer v-else
            v-model="show"
            :src="pdfSrc"
            type="html5"
            content-class="absolute"
            class="flex flex-center"
        />
    </q-page>
</template>

<script>
import CommErrorBanner from 'components/CommErrorBanner';

import { getNetworkdiagram } from '@/utils/api.js';

export default {
    name: 'S4NetworkDiagram',
    components: {
        CommErrorBanner
    },
    data () {
        return {
            show: true,
            pdfSrc: undefined,
            errored: false
        //   src: 'statics/S4NetworkDiagram.pdf'
        }
    },
    methods: {
        async fetchPDF (payload) {
            try {
                const pdfData = await getNetworkdiagram();
                // create the blob
                const blob = new Blob([pdfData], { type: pdfData.type })
                // set reactive variable
                this.pdfSrc = window.URL.createObjectURL(blob);
                this.errored = false;
            } catch (error) {
                console.error(`fetchPDF: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
                // this.$q.notify({
                //     message: 'Error downloading PDF',
                //     type: 'negative',
                //     textColor: 'white',
                //     color: 'negative',
                //     icon: 'error',
                //     closeBtn: 'close',
                //     position: 'top'
                // });
            }
        }
    },
    created() {
        this.fetchPDF();
    }
}
</script>
