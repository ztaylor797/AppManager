<template>
    <div id="q-app">
        <router-view />
        <!-- Hide the app until autologin attempt finishes -->
        <!-- <q-inner-loading :showing="!autoLoginAttemptFinished">
            <q-spinner-gears size="50px" color="primary" dark />
        </q-inner-loading> -->
    </div>
</template>

<script >
export default {
    name: 'App'
    // computed: {
    //     autoLoginAttemptFinished() {
    //         return this.$store.state.autoLoginAttemptFinished;
    //     }
    // }
}
</script>
