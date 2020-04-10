<template>
    <div>
        <!-- {{ instance }} : {{ env }} : {{ portfolio }} : {{ shortAlias }} -->
        <q-input
            v-if="init"
            v-model="emails"
            filled
            autogrow
            stack-label
            :label="`${shortAlias}:${longAlias}`"
            :bg-color="emails.trim() === origEmails.trim() ? '' : 'warning'"
            @input="$emit('emailsChanged', { instance, env, portfolio, shortAlias, longAlias, emails, emailFileFP });"
            :readonly="shortAlias === 'a'"
            :hint="shortAlias === 'a' ? 'The Acxiom list cannot be changed.' : ''"
            hide-hint
            style="max-width: 500px"
            lazy-rules
            :rules="[
                val => !/[\n\r]+/.test(val) || 'Do not include newlines or carriage returns, only spaces between emails.',
                val => emailListRx.test(val) || 'Please use only valid @citi.com or @acxiom.com addresses.'
            ]"
            >
            <template v-slot:before>
                <q-icon name="mail" />
            </template>
        </q-input>
    </div>
</template>

<script>

export default {
    props: [
        'instance', 'env', 'portfolio', 'line', 'emailFileFP'
    ],
    data: function() {
        return {
            emails: '',
            emailListRx: /^( *[_a-zA-Z0-9.]+@(acxiom|citi|imcnam\.ssmb)\.com *)+$/,
            init: false
        }
    },
    computed: {
        shortAlias() {
            return this.line.split('|')[0];
        },
        longAlias() {
            return this.line.split('|')[1];
        },
        origEmails() {
            return this.line.split('|')[2];
        }
    },
    mounted() {
        this.emails = this.origEmails;

        // The point of this nextTick call and the init variable is because the autogrow functionality on the q-input fields doesn't like to work on initial page render. This was the easiest workaround I found. It just slightly delays the population of the inputs so they render to the right height without scrollbars.
        this.$nextTick(() => {
            this.init = true;
        });
        // this.init = true;
    }
}
</script>

<style lang="sass" scoped>

</style>
