import {
    Loading,

    // optional!, for example below
    // with custom spinner
    QSpinnerGears
} from 'quasar';

export default async ({ store }) => {
    Loading.show({
        spinner: QSpinnerGears,
        spinnerSize: '50px',
        spinnerColor: 'primary'
        // other props
    });
    store.dispatch('tryAutoLogin');
    // Loading.hide called at the end of the tryAutoLogin method in store
}
