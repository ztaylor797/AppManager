<template>
    <q-page>
        <h4>Please select a page from the menu on the left.</h4>
        <InfoBanner>This website is replacing the old 8080 website. If you have any questions or issues, please direct them to <a class="text-white text-bold" href="mailto:ccsi_304_s4@acxiom.com">ccsi_304_s4@acxiom.com</a>.</InfoBanner>
        <!-- <q-btn :color="buttoncolor"  @click="onClick">Click me I'm {{ buttoncolor }}</q-btn> -->
        <div class="q-mt-md q-px-lg q-py-sm bg-grey-10 rounded-borders">
            <q-timeline color="primary">
                <q-timeline-entry heading>Updates & News</q-timeline-entry>
                <q-timeline-entry
                    v-for="entry in timelineEntries"
                    :key="entry.title + entry.subtitle"
                    :title="entry.title"
                    :subtitle="entry.date"
                    :icon="entry.icon"
                >
                    <div v-html="entry.contents" />
                </q-timeline-entry>
            </q-timeline>
        </div>
    </q-page>
</template>

<script>
import InfoBanner from 'components/InfoBanner';

export default {
    name: 'PageIndex',
    components: {
        InfoBanner
    },
    data() {
        return {
            buttoncolor: 'red',
            timelineEntries: [ // These should be in reverse chronological order, newest entries at the top
                // Dates are parsed into Date objects so stick to the format below
                {
                    title: 'v1.2.0 - Email notifications enabled',
                    date: 'June 29, 2020',
                    contents: 'Email notifications will now be sent to s4qasupport@citi.com whenever changes are submitted.'
                },
                {
                    title: 'v1.1.0 - FDR config page now available',
                    date: 'June 25, 2020',
                    contents: 'The FDR port and FID config page is now available for use.'
                },
                {
                    title: 'v1.0.0 - Wiki now available',
                    date: 'June 24, 2020',
                    contents: 'The wiki has been fully updated to include all the content from the old wiki.'
                },
                {
                    title: 'ActiveDirectory authentication added',
                    date: 'June 15, 2020',
                    contents: 'CITACX AD authentication for the site as a whole has been added.'
                },
                {
                    title: 'Batch schema and email config pages now available',
                    date: 'June 5, 2020',
                    contents: 'The batch db schema master config page as well as batch citimaildist config pages are now available for use.'
                },
                {
                    title: 'Version notes added to website',
                    date: 'June 4, 2020',
                    contents: 'Version notes added in order to keep track of new <b>features</b> or <b>changes</b> to this website.'
                }
            ]
        };
    },
    methods: {
        onClick() {
            this.buttoncolor = this.buttoncolor === 'red' ? 'blue' : 'red';
        }
    }
}
</script>

<style lang="sass" scoped>
</style>
