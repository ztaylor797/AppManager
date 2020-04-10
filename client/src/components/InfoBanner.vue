<template>
    <q-banner dense inline-actions rounded class="text-white q-mt-sm" :class="bgClass" >
        <slot name="avatar">
            <q-icon :name="iconName" style="font-size: 1.5rem;" class="q-pl-sm q-pr-md" />
        </slot>
        <slot />
    </q-banner>
</template>

<script>
export default {
    name: 'InfoBanner',
    props: {
        infoType: {
            type: String,
            default: 'info'
        }
    //     iconName: {
    //         type: String,
    //         default: 'report'
    //     }
    },
    computed: {
        iconName() {
            if (this.infoType === 'info') {
                return 'info';
            } else if (this.infoType === 'positive') {
                return 'check_circle';
            } else if (this.infoType === 'warn') {
                return 'warning';
            } else if (this.infoType === 'error') {
                return 'report';
            } else {
                return 'info';
            }
        },
        bgClass() {
            if (this.infoType === 'info') {
                return 'bg-accent';
            } else if (this.infoType === 'positive') {
                return 'bg-positive';
            } else if (this.infoType === 'warn') {
                return 'bg-warning';
            } else if (this.infoType === 'error') {
                return 'bg-negative';
            } else {
                return 'bg-info';
            }
        }
    }
}
</script>
