<template>
    <q-page :key="componentKey">
        <CommErrorBanner v-if="errored" />
        <div v-else>
            <h4>Email Distro Config</h4>
            <!-- <p>{{ highlightDiffs("ztaylo@acxiom.com beskin@acxiom.com", "ztaylo@acxiom.com newemail@acxiom.com") }}</p>
            <p>{{ highlightDiffs("ztaylo@acxiom.com newemail@acxiom.com", "ztaylo@acxiom.com beskin@acxiom.com", true) }}</p> -->
            <q-tabs
                v-model="tab"
                stretch
                inline-label
                align="justify"
                class="rounded-borders"
            >
                    <q-tab name="qa" label="QA" icon="fas fa-vial" class="text-blue" />
                    <q-tab name="prod" label="PROD" icon="fab fa-product-hunt" class="text-red" />
            </q-tabs>
            <p class="q-mt-md">Please use the tabs above to pick an instance to view. Then edit the appropriate email entries and click submit.</p>
            <InfoBanner>These emails control citimaildist's behavior in their respective environments.</InfoBanner>
            <InfoBanner>Currently we do not allow adding new option entries (new sections like "a:acxiom" or similar) via this page. Please email ccsi_304_s4@acxiom.com to have a new option added.</InfoBanner>
            <!-- <p><pre>CHANGES: {{ JSON.stringify(changes, undefined, 4) }}</pre></p> -->
            <!-- <p><pre>EMAILCONFIG: {{ JSON.stringify(origEmailConfig, undefined, 4) }}</pre></p> -->

            <q-tab-panels v-model="tab" animated keep-alive class="rounded-borders panel-dark-bg">
                <q-tab-panel v-for="(instanceConfig, instance) in emailConfig" :name="instance" :key="instance" style="min-height: 400px">

                    <div class="q-mt-md">
                        <div v-if="envOpts.length > 0 && selectedEnvs[instance]" class="row q-gutter-lg items-center">
                            <q-chip color="warning" icon="visibility">
                                Toggle Env Visibility
                            </q-chip>
                            <q-option-group
                                v-model="selectedEnvs[instance]"
                                :options="envOpts"
                                color="warning"
                                type="checkbox"
                                inline
                                class="q-ml-sm"
                            />
                        </div>
                        <div v-if="portfolioOpts.length > 0 && selectedPortfolios[instance]" class="row q-gutter-lg items-center">
                            <q-chip color="accent" icon="visibility" >
                                Toggle Portfolio Visibility
                            </q-chip>
                            <q-option-group
                                v-model="selectedPortfolios[instance]"
                                :options="portfolioOpts"
                                color="accent"
                                type="checkbox"
                                inline
                                class="q-ml-sm"
                            />
                        </div>
                    </div>

                    <q-form
                        @submit="openConfirmDialog"
                        @reset="onReset"
                        spellcheck="false"
                        autocorrect="off"
                        autocapitalize="off"
                        class="q-mt-md"
                    >
                        <div class='q-mb-lg'>
                            <q-btn label="Submit" type="submit" icon-right="send" :disable="Object.keys(changes).length <= 0" color="positive" />
                            <q-btn label="Reset" type="reset" icon-right="undo" color="primary" flat class="q-ml-sm" />
                        </div>

                        <InfoBanner infoType="error" v-if="updateSuccessful === false" class="q-mb-md">
                            Email config update was unsuccessful.
                        </InfoBanner>
                        <InfoBanner infoType="positive" v-if="updateSuccessful === true" class="q-mb-md">
                            Email config update was succesful!
                        </InfoBanner>

                        <!-- <p>{{ envOpts }}</p>
                        <p>{{ selectedEnvs }}</p> -->

                        <div class="row row-md-6 items-start q-gutter-md">
                            <!-- Using template here instead of div so we don't get extra spacing when we enable or disable visibility of various cards -->
                            <template v-for="obj in instanceConfig">
                                <q-card
                                    :key="obj.env + obj.portfolio"
                                    v-show="selectedEnvs[instance] && selectedEnvs[instance].includes(obj.env) && selectedPortfolios[instance] && selectedPortfolios[instance].includes(obj.portfolio)"
                                    class="email-card"
                                    bordered
                                >
                                    <q-card-section :class="bgColor(instance)">
                                        <div class="text-h6">{{ obj.env }} : {{ obj.portfolio }}</div>
                                        <div class="text-subtitle2">{{ obj.emailFileFP }}</div>
                                    </q-card-section>
                                    <q-card-section>
                                        <!-- {{ obj.contentLines }} -->
                                        <div v-for="line in obj.contentLines" :key="line">
                                            <EmailLine
                                                :instance="instance"
                                                :env="obj.env"
                                                :portfolio="obj.portfolio"
                                                :emailFileFP="obj.emailFileFP"
                                                :line="line"
                                                @emailsChanged="saveNewConfig($event)"
                                            />
                                        </div>
                                    </q-card-section>
                                </q-card>
                            </template>
                        </div>
                    </q-form>
                </q-tab-panel>
            </q-tab-panels>

            <!-- <pre class="text-red">{{ JSON.stringify(emailConfig, undefined, 4) }}</pre> -->
        </div>

        <q-dialog v-model="confirmDialogOpen"
            v-if="confirmDialogOpen"
            persistent
            maximized
            transition-show="slide-up"
            transition-hide="slide-down"
        >
            <q-card>
                <q-card-section class="bg-primary">
                    <!-- <q-avatar icon="signal_wifi_off" color="primary" text-color="white" /> -->
                    <span class="text-h6">Please confirm the following email changes:</span>
                </q-card-section>

                <q-card-section class="q-pa-none confirm-table">
                    <!-- <pre>{{ JSON.stringify(changes, undefined, 4) }}</pre> -->
                    <q-markup-table wrap-cells>
                        <thead>
                            <th>Instance</th>
                            <th>Env</th>
                            <th>Portfolio</th>
                            <th>Alias</th>
                            <th class="text-positive">New</th>
                            <th class="text-warning">Old</th>
                        </thead>
                        <tbody>
                            <tr v-for="(change, key) in changes" :key="key">
                                <td :class="change.instance === 'prod' ? 'bg-negative' : 'bg-primary'">{{ change.instance }}</td>
                                <td>{{ change.env }}</td>
                                <td>{{ change.portfolio }}</td>
                                <td>{{ change.shortAlias }}:{{ change.longAlias }}</td>
                                <!-- <td class="">{{ highlightDiffs(change.emails, getOrigEmails(change)) }}</td> -->
                                <td class="" v-html="highlightDiffs(change.emails, getOrigEmails(change))" />
                                <td class="" v-html="highlightDiffs(getOrigEmails(change), change.emails, true)" />
                            </tr>
                        </tbody>
                    </q-markup-table>
                </q-card-section>

                <q-card-actions align="left">
                    <q-btn flat label="Cancel" color="warning" v-close-popup />
                    <q-btn flat label="Confirm" color="positive" v-close-popup @click="onSubmit" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <q-inner-loading :showing="loading">
            <q-spinner-gears size="50px" color="primary" dark />
        </q-inner-loading>
    </q-page>
</template>

<script>
// This script is a bit of a complex mess due to all the nested levels. Sorry future person.
// If needing to do something similar, use the batch schema config page as a better example.

import CommErrorBanner from 'components/CommErrorBanner';
import InfoBanner from 'components/InfoBanner';
import EmailLine from 'components/EmailLine';

import { extend } from 'quasar'; // Deep copy util

import { getEmailConfig, updateEmailConfig } from '@/utils/api.js';

export default {
    name: 'EmailConfig',
    components: {
        CommErrorBanner,
        InfoBanner,
        EmailLine
    },
    data: function() {
        return {
            componentKey: 0,
            tab: 'qa',
            instances: ['qa', 'prod'],
            loading: true,
            errored: false,
            emailConfig: undefined,
            updateSuccessful: undefined,
            confirmDialogOpen: false,
            changes: {},
            selectedEnvs: {},
            selectedPortfolios: {}
        }
    },
    computed: {
        envs() {
            if (this.emailConfig) {
                // Return unique array of env strings
                return [...new Set(this.emailConfig[this.tab].map(el => el.env))];
            } else {
                return [];
            }
        },
        envOpts() {
            if (this.envs.length) {
                return this.envs.map(env => {
                    return { label: env, value: env };
                });
            } else {
                return [];
            }
        },
        portfolios() {
            // Return unique array of portfolio strings
            if (this.emailConfig) {
                return [...new Set(this.emailConfig[this.tab].map(el => el.portfolio))];
            } else {
                return [];
            }
        },
        portfolioOpts() {
            if (this.portfolios.length) {
                return this.portfolios.map(portfolio => {
                    return { label: portfolio, value: portfolio };
                });
            } else {
                return [];
            }
        }
    },
    methods: {
        async refreshEmailConfig() {
            try {
                this.emailConfig = undefined;
                const emailConfig = await getEmailConfig();
                this.emailConfig = emailConfig;
                this.origEmailConfig = extend(true, {}, emailConfig);
            } catch (error) {
                console.error(`mounted: A promise(s) failed to resolve: ${error}`);
                this.errored = true;
            } finally {
                this.loading = false;
                this.forceRerender();
            }
        },
        bgColor(instance) {
            return instance === 'prod' ? 'bg-negative' : 'bg-primary';
        },
        saveNewConfig(obj) {
            // console.log(`obj: ${JSON.stringify(obj, undefined, 4)}`);
            // Object should contain:   instance, env, portfolio, shortAlias, longAlias, emails
            const key = `${obj.instance}.${obj.env}.${obj.portfolio}.${obj.shortAlias}`;

            // This mess is to check if the changed value is equal to the original value so we can remove it from the changes object
            let matched = false;
            const lines = this.emailConfig[obj.instance].filter(el => el.env === obj.env && el.portfolio === obj.portfolio)[0].contentLines;
            lines.forEach(line => {
                const arr = line.split('|');
                arr.splice(1, 1);
                const [shortAlias, emails] = arr;
                if (obj.shortAlias === shortAlias) {
                    if (obj.emails.trim() === emails.trim()) {
                        matched = true;
                        // delete from this.changes
                        this.$delete(this.changes, key);
                    }
                }
            });

            if (!matched) {
                this.$set(this.changes, key, obj);
            }
        },
        forceRerender() {
            this.componentKey += 1;
        },
        openConfirmDialog() {
            this.confirmDialogOpen = true;
        },
        async onSubmit() {
            // await updateEmailConfig
            // console.log('onSubmit called!');

            this.updateSuccessful = undefined;
            // console.log(`CHANGES: ${JSON.stringify(this.changes, undefined, 2)}`)
            try {
                const data = await updateEmailConfig(this.changes);
                // const esbPortData = data.esbPortData;
                // const newCurrPorts = esbPortData.currPorts;
                this.updateSuccessful = data.successful;
                this.emailConfig = data.emailConfig;

                // this.currPorts = newCurrPorts;
                // Deep copy newSelected object into new {} object
                // this.origSelected = extend(true, {}, newCurrPorts);
                this.changes = {};
                this.forceRerender();
                // this.refreshEmailConfig();
            } catch (err) {
                console.error(`onSubmit: A promise(s) failed to resolve: ${err}`);
                this.updateSuccessful = false;
            }
        },
        onReset() {
            // Easiest just to reload the page
            // this.$router.go();
            this.changes = {};
            this.loading = true;
            this.errored = undefined;
            this.updateSuccessful = undefined;
            this.refreshEmailConfig();
        },
        getOrigEmails({ instance, env, portfolio, shortAlias }) {
            return this.origEmailConfig[instance]
                .filter(el => el.portfolio === portfolio && el.env === env)[0]
                .contentLines.filter(el => el.split('|')[0] === shortAlias)[0]
                .split('|')[2];
        },
        highlightDiffs(dispStr, compStr, invert = false) {
            function words(s) {
                return s.toLowerCase().match(/[a-zA-Z0-9_.@]+/g);
            }

            const d = words(dispStr);
            const c = words(compStr);

            // console.log(d);

            const className = invert ? 'text-warning text-strike' : 'text-positive';

            d.forEach(word => {
                if (!c.includes(word)) {
                    // const rx = new RegExp(`${word}`);
                    // console.log(`replace ${word}`);
                    dispStr = dispStr.replace(new RegExp(word, 'g'), `<span class="${className}">${word}</span>`);
                }
            });
            // console.log(dispStr);
            return dispStr;
            // return `<div>${dispStr}</div>`;
        }
    },
    async mounted() {
        await this.refreshEmailConfig();
        this.instances.forEach(instance => {
            const envs = [...new Set(this.emailConfig[instance].map(el => el.env))];
            const portfolios = [...new Set(this.emailConfig[instance].map(el => el.portfolio))];
            // console.log(envs);
            // console.log(portfolios);
            this.$set(this.selectedEnvs, instance, envs);
            this.$set(this.selectedPortfolios, instance, portfolios);
        });
        // console.log(this.selectedEnvs);
        // console.log(this.selectedPortfolios);
    }
}
</script>

<style lang="sass" scoped>
.email-card
    // width: 100%;
    min-width: 500px;
    max-width: 1000px;
    tr > :nth-child(1)
        font-weight: bold;
    tr > :nth-child(2)
        // width: 70%;

.confirm-table
    th > :nth-child(1), th > :nth-child(2), th > :nth-child(3), th > :nth-child(4)
        text-align: center;
        // font-weight: bold;
    tr > :nth-child(1), tr > :nth-child(2), tr > :nth-child(3), tr > :nth-child(4)
        text-align: center;
    // tr > :nth-child(2)

.panel-dark-bg
    background-color: $dark-page
</style>
