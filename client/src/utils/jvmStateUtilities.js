const getStateDisplayProperties = (state) => {
    /* eslint-disable indent */
    switch (state) {
        case 'UNKNOWN':
            return {
                iconName: 'fas fa-question-circle',
                color: 'warning',
                definition: 'State could not be determined. This should not happen.'
            };
        case 'OFFLINE':
            return {
                iconName: 'fas fa-times-circle',
                color: 'negative',
                definition: 'The JVM is completely shut down.'
            };
        case 'BOOTING':
            return {
                color: 'info',
                definition: 'The JVM is starting up.'
            };
        case 'DEPLOYING':
            return {
                color: 'info',
                definition: 'An EAR is deploying to the JVM. This may take a few minutes.'
            };
        case 'HUNG':
            return {
                iconName: 'fas fa-skull-crossbones',
                color: 'negative',
                definition: 'The JVM is running, but unresponsive.'
            };
        case 'RUNNING':
            return {
                iconName: 'fas fa-handshake-alt-slash',
                color: 'warning',
                definition: 'The JVM is online, but not accepting external traffic via the Netscaler. Local SOAP requests via internal port will work.'
            };
        case 'ONLINE':
            return {
                iconName: 'fas fa-check-circle',
                color: 'positive',
                definition: 'The JVM is online and accepting all transactions.'
            };
        case 'SOAP_COMM_ERROR':
            return {
                iconName: 'fas fa-exclamation-triangle',
                color: 'negative',
                definition: 'The JVM SOAP connectivity test failed. This can happen during EAR deployments or hot reloads. Or if the Delegation EAR is in failed state.'
            };
    }
    /* eslint-enable indent */
}

module.exports = {
    getStateDisplayProperties
}
