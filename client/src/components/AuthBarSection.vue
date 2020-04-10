<template>
    <div class="self-stretch row">
        <div v-if="isAuthenticated" class="row" >
            <q-btn flat to="/user">{{ userid }}</q-btn>
            <q-separator vertical />
            <q-btn flat stretch label="Logout" @click="logout" />
        </div>
        <div v-else class="row self-stretch">
            <q-btn flat label="Login" to="/login" />
            <!-- <q-btn flat label="Register" to="/register" /> -->
        </div>
    </div>
</template>

<script>

export default {
    computed: {
        isAuthenticated() {
            return this.$store.getters.isAuthenticated;
        },
        userid() {
            return this.$store.state.tokenPayload.userid;
        }
    },
    methods: {
        logout() {
            this.$store.dispatch('logout');
        }
    }
}
</script>

<style>

</style>
