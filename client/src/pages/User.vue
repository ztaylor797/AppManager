<template>
    <div>
        <q-card class="user-card q-mt-md" bordered>
            <q-card-section class="bg-primary">
                <div class="text-h6">User Info</div>
            </q-card-section>

            <q-separator />

            <q-card-section style="white-space: pre-line; word-break: break-all; padding: 0">
                <q-markup-table dense square flat class="text-left user-table">
                    <tbody>
                        <tr v-for="(value, key) in entries" :key="key">
                            <td class='text-weight-bold'>{{ key }}</td>
                            <td>{{ value }}</td>
                        </tr>
                    </tbody>
                </q-markup-table>
            </q-card-section>
        </q-card>
        <div class="q-mt-md">
            <i>* lastAccessTs does not currently update.</i>
        </div>
    </div>
</template>

<script>

export default {
    data: function() {
        return {

        }
    },
    computed: {
        tokenPayload() {
            return this.$store.state.tokenPayload;
        },
        userid() {
            return this.tokenPayload.userid;
        },
        name() {
            return this.tokenPayload.name;
        },
        email() {
            return this.tokenPayload.email;
        },
        registeredTs() {
            return this.tokenPayload.registeredTs;
        },
        lastAccessTs() {
            return this.tokenPayload.lastAccessTs;
        },
        entries() {
            return {
                userid: this.userid,
                name: this.name,
                email: this.email,
                registeredTs: this.registeredTs,
                lastAccessTs: this.lastAccessTs
            };
        }
    },
    methods: {

    }
}
</script>

<style lang="sass" scoped>
.user-card
    width: 100%;
    max-width: 400px;
    tr > :nth-child(1)
        width: 30%;
.user-table
    width: 100%;
</style>
