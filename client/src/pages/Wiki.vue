<!--
To add new Wiki pages, create a vue+markdown .vmd file in /wiki based on the other examples.
Then, add a line to routes.js using the genWikiRoute method. If the page is a child of another page, make sure to next it as necessary. (All pages should be at least children of the WikiHome page, which is automatically appended in the routes gen method).

Notes:
When linking to other pages, whether the target URL is in the wiki or not as long as they are in this website, use <router-link>. DO NOT use the built in wiki links. They will always open a new window which does not fit with our SPA design.
Make sure to leave an empty line within the q-markdown div above the markdown itself.
-->

<template>
    <div class="q-pt-sm">
        <q-toolbar class="bg-dark rounded-borders crumb-toolbar" >
            <q-breadcrumbs class="text-weight-bold">
                <template v-slot:separator>
                    <q-icon
                        size="1.5em"
                        name="chevron_right"
                        color="primary"
                    />
                </template>
                <q-breadcrumbs-el
                    v-for="crumb in crumbs"
                    :key="crumb.key"
                    :label="crumb.key"
                    :to="crumb.to"
                />
            </q-breadcrumbs>
        </q-toolbar>
        <component :is="markdownName" />
    </div>
</template>

<script>

export default {
    props: [
        'markdownName'
    ],
    computed: {
        crumbs() {
            const keys = this.$route.fullPath.split('/').filter(Boolean);
            // console.log(`KEYS: ${keys}`);
            let path = '';
            return keys.map(key => {
                // console.log(`key: ${key}`);
                path += `/${key}`;
                // console.log(`path: ${path}`);
                // This is so the url can be /wiki/ but display Wiki in the breadcrumb.
                // Child paths can be uppercase if desired.
                if (key === 'wiki') {
                    key = 'Wiki';
                }
                return { key, to: path };
            });
        }
        // async markdownComponent() {
        //     if (this.markdownName) {
        //         return undefined;
        //     }
        //     // eslint-disable-next-line
        //     return await import(`../wiki/${this.markdownName}.vmd`);
        // }
    },
    created() {
        // console.log('CREATED');
        // This is all to dynamically import the .vmd wiki file as needed based on the wiki subroute (via route prop)
        const requireComponent = require.context(
            // The relative path of the components folder
            '../wiki',
            // Whether or not to look in subfolders
            false,
            // The regular expression used to match base component filenames
            /.*\.vmd/
        );

        requireComponent.keys().forEach(filename => {
            // console.log(`filename: ${filename} markdownName: ${this.markdownName}`);
            if (filename.split('/').pop() === `${this.markdownName}.vmd`) {
                // console.log(`matched: ${this.markdownName}`);
                const componentConfig = requireComponent(filename);
                // Register component locally
                this.$options.components[this.markdownName] = componentConfig.default || componentConfig;
            }
        });
    }
}
</script>

<style lang="sass" scoped>
.crumb-toolbar
    border: 2px solid $primary
</style>
