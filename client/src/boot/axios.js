// import Vue from 'vue';
import axios from 'axios';
import { LoadingBar } from 'quasar';

export default ({ Vue /* app, router, Vue, ... */ }) => {
    console.log(`Location: ${location.hostname} ${location.port}`);

    axios.defaults.baseURL = process.env.generateAPIURL(location.hostname);
    axios.defaults.withCredentials = true; // Required to send cookies and receive via Axios
    axios.defaults.timeout = 6000;

    // Add a request interceptor
    axios.interceptors.request.use(function (config) {
        LoadingBar.start();
        return config;
    }, function (error) {
        LoadingBar.stop();
        // Do something with request error
        return Promise.reject(error);
    });

    // Add a response interceptor
    axios.interceptors.response.use(function (response) {
        LoadingBar.stop();
        // Any status code that lie within the range of 2xx cause this function to trigger
        // Do something with response data
        return response;
    }, function (error) {
        LoadingBar.stop();
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        // Do something with response error
        return Promise.reject(error);
    });

    Vue.prototype.$axios = axios;

    // export default axios.create();
}
