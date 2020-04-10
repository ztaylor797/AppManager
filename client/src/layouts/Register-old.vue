<template>
    <q-layout view="hHh LpR fFf">
        <q-page-container> <!-- TODO add no-scroll back to class-->
            <q-page
                class="window-height window-width row justify-center items-center"
                style="background: rgb(29,29,29); background: linear-gradient(90deg, rgba(29,29,29,1) 0%, rgba(25,118,210,1) 100%);"
            >

                <div class="column q-pa-lg">
                    <!-- <p>registrationStatus: {{ registrationStatus }}</p>
                    <p>authFailed: {{ authFailed }}</p>
                    <p>invalid: {{ $v.$invalid }}</p>
                    <p>error: {{ $v.$error }}</p>
                    <p><pre>{{ JSON.stringify($v.user.email, undefined, 2) }}</pre></p> -->

                    <div class="row">

                        <q-form @submit="register">
                            <q-card class="shadow-24 q-pb-md" style="width:305px;min-height:485px;" rounded>

                                <q-card-section class="bg-primary">
                                    <h4 class="text-h5 text-white q-my-md">Registration</h4>
                                </q-card-section>

                                <q-card-section class="q-mt-lg q-mb-md">
                                    <q-input square clearable clear-icon="close"
                                        label="Full Name"
                                        v-model.trim="user.name"
                                        @blur="$v.user.name.$touch()"
                                        class="full-width"
                                        lazy-rules
                                        :rules="[
                                            val => $v.user.name.required || 'Name is required.',
                                            val => $v.user.name.minLength || 'Name must be at least 5 characters.',
                                        ]"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="person_outline" />
                                        </template>
                                    </q-input>
                                    <q-input square clearable clear-icon="close"
                                        v-model.trim="user.email"
                                        label="Email"
                                        debounce="500"
                                        lazy-rules
                                        @blur="$v.user.email.$touch()"
                                        :error="$v.user.email.$error"
                                        :error-message="emailValErrorMsg"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="email" />
                                        </template>
                                    </q-input>
                                    <q-input square clearable clear-icon="close"
                                        v-model.trim="user.userid"
                                        label="Acxiom User ID"
                                        @blur="$v.user.userid.$touch"
                                        lazy-rules
                                        :rules="[
                                            val => $v.user.userid.required || 'UserID is required.',
                                            val => $v.user.userid.minLength || 'UserID must be at least 5 characters.',
                                        ]"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="person" />
                                        </template>
                                    </q-input>
                                    <q-input square clearable clear-icon="close"
                                        v-model="user.password"
                                        type="password"
                                        label="Acxiom Password"
                                        @blur="$v.user.password.$touch"
                                        lazy-rules
                                        :rules="[
                                            val => $v.user.password.required || 'Password is required.',
                                            val => $v.user.password.minLength || 'Password must be at least 6 characters.',
                                        ]"
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="lock" />
                                        </template>
                                    </q-input>
                                    <!-- <q-checkbox v-model="rememberMe" label="Remember me" class="q-mt-md" /> -->
                                </q-card-section>

                                <q-card-actions class="q-px-lg">
                                    <div class="q-gutter-sm full-width">
                                        <q-btn unelevated size="lg" color="accent" class="full-width" label="Register" :loading="registrationStatus === 'Authenticating'" :disable="$v.$invalid" @click="register">
                                        </q-btn>
                                        <q-btn unelevated outline size="md" color="primary" class="full-width" label="Return to login" to="/login">
                                        </q-btn>
                                    </div>
                                </q-card-actions>

                                <q-card-section class="text-warning" v-if="authFailed">
                                    Registration failed: <b>{{ registrationStatus }}</b>! <span v-if="registrationStatus === 'Invalid password'">Please note 3 failed attempts will lock your account. Contact citihelp@acxiom.com for unlocks.</span>
                                </q-card-section>

                            </q-card>
<!--
                            <div style="position: relative">
                                <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%);" class="full-width">
                                    <form-summary/>
                                </div>
                            </div> -->

                        </q-form>
                    </div>
                </div>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script>
// This page uses vuelidate unlike the Login page. It is a bit complex. We're using some vuelidate helper components. These are set up in boot/vuelidate.js

import axios from 'axios';
import { required, email, minLength } from 'vuelidate/lib/validators';

const isValidEmailDomain = val => {
    if (val === '') {
        return true;
    }
    if (!/@citi.com$|@acxiom.com$/.test(val)) {
        return false;
    }
    return true;
}

export default {
    name: 'register',
    components: {
    },
    data() {
        return {
            user: {
                name: null,
                email: null,
                userid: null,
                password: null
            }
            // confirmPassword: null
        }
    },
    validations: {
        // DO NOT USE ASYNC VALIDATORS WITH QUASAR INPUT "rules" ATTRIBUTE. That's why emails has a different q-input setup than all the others. Due to its "unique" validator.
        user: {
            name: {
                required,
                minLength: minLength(5)
            },
            email: {
                required,
                email,
                validDomain: isValidEmailDomain,
                unique(val) {
                    if (val === '') return true;
                    if (!isValidEmailDomain(val)) {
                        return true;
                    }

                    // return true;
                    return axios.post('/api/users', { email: val })
                        .then(res => {
                            console.log(res.data);
                            if (!res.data.user_found) {
                                console.log('return true');
                                return true;
                            } else {
                                console.log('return false');
                                return false;
                            }
                            // console.log(Object.keys(res.data).length);
                            // return Object.keys(res.data).length <= 0;
                        })
                        .catch(err => {
                            console.error(err);
                            return true;
                        });
                }
            },
            userid: {
                required,
                minLength: minLength(5)
            },
            password: {
                required,
                minLength: minLength(6)
            }
        }
        // confirmPassword: {
        //     // sameAs: sameAs('password')
        //     sameAs: sameAs(vm => {
        //         return vm.password
        //     })
        // }
    },
    mounted() {
        this.$store.commit('setRegistrationStatus', undefined);
    },
    computed: {
        registrationStatus() {
            return this.$store.state.registrationStatus;
        },
        authFailed() {
            return this.registrationStatus && this.registrationStatus !== 'Authenticating' && this.registrationStatus !== 'Successful';
        },
        emailValErrorMsg() {
            const email = this.$v.user.email;
            if (!email.required) return 'Email is required.';
            if (!email.email) return 'Invalid email.';
            if (!email.validDomain) return 'Email domain must be @citi.com or @acxiom.com.';
            if (!email.unique) return 'This email address is already registered.';
            return undefined;
        }
    },
    methods: {
        register() {
            console.log('Register invoked');
            const formData = this.user;

            this.$store.dispatch('register', formData);
            this.password = null;
        }
    }
}
</script>

<style scoped>

/* input {
    padding-top: 24px;
} */
/* .invalid label {
    color: red;
}

.invalid input {
    border: 1px solid red;
    background-color: #ffc9aa;
}

p.invalid {
    color: red;
}

.alert .spinner-grow {
    position: relative;
    top: -2px;
} */
</style>
