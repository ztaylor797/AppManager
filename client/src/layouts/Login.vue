<template>
    <q-layout view="hHh LpR fFf">
        <q-page-container>
            <q-page
                class="window-height window-width row justify-center items-center"
                style="background: rgb(29,29,29); background: linear-gradient(90deg, rgba(29,29,29,1) 0%, rgba(25,118,210,1) 100%);"
            >

                <!-- <p>Loginstatus: {{ loginStatus }}</p>
                <p>authFailed: {{ authFailed }}</p> -->
                <div class="column q-pa-lg">
                    <div class="row">

                        <q-form @submit="login">
                            <q-card class="shadow-24 q-pb-md" bordered style="width:305px;min-height:485px;" rounded>

                                <q-card-section class="bg-primary">
                                    <!-- <h4 class="text-h5 text-white q-my-md shadow"></h4> -->
                                    <!-- <h4 class="text-h5 ">Acxiom S4 Manager</h4> -->
                                    <div class="text-h5 text-white q-my-md shadow">Acxiom S4 Manager</div>
                                </q-card-section>

                                <q-card-section class="q-mt-lg q-mb-md">
                                    <q-input square clearable clear-icon="close"
                                        v-model.trim="userid"
                                        label="Acxiom User ID"
                                        @blur="$v.userid.$touch"
                                        lazy-rules
                                        :rules="[
                                            val => $v.userid.required || 'UserID is required.',
                                            val => $v.userid.minLength || 'UserID must be at least 5 characters.',
                                        ]"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="person" />
                                        </template>
                                    </q-input>
                                    <q-input square clearable clear-icon="close"
                                        v-model="password"
                                        type="password"
                                        label="Acxiom Password"
                                        @blur="$v.password.$touch"
                                        lazy-rules
                                        :rules="[
                                            val => $v.password.required || 'Password is required.',
                                            val => $v.password.minLength || 'Password must be at least 6 characters.',
                                        ]"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="lock" />
                                        </template>
                                    </q-input>
                                    <q-checkbox v-model="rememberMe" label="Remember me" class="q-mt-sm" />
                                </q-card-section>

                                <q-card-actions class="q-px-lg">
                                    <div class="q-gutter-sm full-width">
                                        <q-btn unelevated size="lg" type="submit" color="accent" class="full-width" label="Login" :loading="loginStatus === 'Authenticating'" :disable="$v.$invalid">
                                        </q-btn>
                                        <!-- <q-btn unelevated outline size="md" color="primary" class="full-width" label="Register" to="/register">
                                        </q-btn> -->
                                    </div>
                                </q-card-actions>

                                <!-- <q-card-section class="text-center q-pa-sm">
                                    <p class="text-grey-6">Forgot your password?</p>
                                </q-card-section> -->
                                <q-card-section class="text-warning" v-if="authFailed">
                                    Login failed: <b>{{ loginStatus }}</b>! Please note 3 failed attempts will lock your account. Contact citihelp@acxiom.com for unlocks.
                                </q-card-section>

                            </q-card>

                        </q-form>
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script>
import { required, minLength } from 'vuelidate/lib/validators';

export default {
    name: 'login',
    data() {
        return {
            userid: null,
            password: null,
            rememberMe: false
        }
    },
    mounted() {
        this.$store.commit('setLoginStatus', undefined);
        const cookieUserid = this.$q.cookies.get('s4_manager_userid');
        if (cookieUserid) {
            this.userid = cookieUserid;
        }
    },
    computed: {
        loginStatus() {
            return this.$store.state.loginStatus;
        },
        authFailed() {
            return this.loginStatus && this.loginStatus !== 'Authenticating' && this.loginStatus !== 'Successful';
        },
        formColor() {
            return this.authFailed && this.userid ? 'negative' : '';
        }
    },
    methods: {
        login() {
            const formData = {
                userid: this.userid,
                password: this.password,
                rememberMe: this.rememberMe
            };

            this.$store.dispatch('login', formData);
            // this.password = null;
        }
    },
    validations: {
        // DO NOT USE ASYNC VALIDATORS WITH QUASAR INPUT "rules" ATTRIBUTE. That's why emails has a different q-input setup than all the others. Due to its "unique" validator.
        userid: {
            required,
            minLength: minLength(5)
        },
        password: {
            required,
            minLength: minLength(6)
        }
    }
}
</script>

<style lang="sass" scoped>

.shadow
    // text-shadow: 0 0 20px #fefcc9, 10px -10px 30px #feec85, -20px -20px 40px #ffae34, 20px -30px 35px #ec760c, -20px -40px 40px #cd4606, 0 -50px 65px #973716, 10px -70px 70px #451b0e;

// .invalid label
//     color: red;

// .invalid input
//     border: 1px solid red;
//     background-color: #ffc9aa;

// p.invalid
//     color: red;

</style>
