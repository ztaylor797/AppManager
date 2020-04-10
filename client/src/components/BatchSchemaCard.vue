<template>
    <q-card
        class="schema-card"
        bordered
    >
        <q-card-section class="bg-primary">
            <div class="text-h6">{{ env }}</div>
            <div class="text-subtitle2">{{ schemaFileFP }}</div>
        </q-card-section>
        <q-card-section class="q-pa-none">

            <q-markup-table wrap-cells flat dense square style="width: 100%">
                <thead>
                    <tr class="bg-primary">
                        <th class="text-left">Identifier</th>
                        <th class="text-center">Schemas</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="id in Object.keys(entries)" :key="env + id"
                        :class="calcBgClass(env, id)"
                    >
                        <td>{{ id }}</td>
                        <td>
                            <div class="q-gutter-sm">
                                <q-option-group
                                    :options="schemaOpts"
                                    type="checkbox"
                                    v-model="entries[id]"
                                    inline
                                />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </q-markup-table>
            <!-- <pre>{{ JSON.stringify(entries, undefined, 4) }}</pre> -->

        </q-card-section>
    </q-card>
</template>

<script>
import { areDiff } from '@/utils/objectUtilities.js';

export default {
    props: {
        env: String,
        allSchemas: Array,
        schemaFileFP: String,
        contents: String,
        entries: Object,
        origSchemaConfig: Object
    },
    data() {
        return {
        };
    },
    methods: {
        objAreDiff(obj1, obj2) {
            return areDiff(obj1, obj2);
        },
        calcBgClass(env, id) {
            if (this.entries[id].length <= 0) {
                this.$q.notify({
                    message: `Identifier ${id} must have at least one schema selected.`,
                    type: 'negative',
                    // color: 'white',
                    classes: 'text-white',
                    icon: 'fas fa-exclamation-triangle',
                    group: env
                });
                return 'bg-negative';
            } else if (this.objAreDiff(this.origSchemaConfig[env].entries[id], this.entries[id])) {
                return 'bg-warning';
            }
            return '';
        }
    },
    computed: {
        schemaOpts() {
            return this.allSchemas.map(schema => {
                return { label: schema, value: schema };
            });
        }
    }
}
</script>

<style lang="sass" scoped>
.schema-card
    max-width: 1000px;
    tr > :nth-child(1)
        font-weight: bold;
    th > :nth-child(2)
        width: 70%;
    tr > :nth-child(2)
        width: 70%;

</style>
