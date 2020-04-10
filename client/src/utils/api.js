import axios from 'axios';

const getJvms = async () => {
    try {
        const res = await axios.get('/api/jvmlist');
        return res.data.jvms;
    } catch (error) {
        console.warn(`get jvmlist failed! ${error}`);
        throw error;
        // return [];
    }
}

const getSchemas = async () => {
    return axios
        .get('/api/schemalist')
        .then(res => {
            return res.data.schemas;
        })
        .catch(error => {
            console.warn(`get schemalist failed! ${error}`);
            throw error;
            // return [];
        });
}

const getCurrentJvmSchemas = async () => {
    return axios
        .get('/api/currjvmschemas')
        .then(res => {
            return res.data.currJvmSchemas;
        })
        .catch(error => {
            console.warn(`get currjvmschemas failed! ${error}`);
            throw error;
            // return {};
        });
}

const updateJvmSchemas = async (diffs) => {
    return axios
        .post('/api/updatejvmschemas', { diffs })
        .then(res => {
            return res.data;
        })
        .catch(error => {
            console.warn(`post currjvmschemas failed! ${error}`);
            throw error;
            // return {};
        });
}

const getJvmInfo = async () => {
    try {
        const res = await axios.get('/api/jvminfo');
        return res.data.jvmInfo;
    } catch (error) {
        console.warn(`get jvminfo failed! ${error}`);
        throw error;
    }
}

const getEarContents = async () => {
    try {
        const res = await axios.get('/api/earcontents');
        return res.data.earContents;
    } catch (error) {
        console.warn(`get earcontents failed! ${error}`);
        throw error;
    }
}

const getOutboundStatus = async () => {
    try {
        // Longer timeout because it has to wait for outbound status soap requests to complete
        const res = await axios.get('/api/outboundstatus', { timeout: 10000 });
        return res.data.outboundStatus;
    } catch (error) {
        console.warn(`get outboundStatus failed! ${error}`);
        throw error;
    }
}

const getPropertiesContents = async () => {
    try {
        const res = await axios.get('/api/propertiescontents');
        return res.data.allPropContents;
    } catch (error) {
        console.warn(`get propertiescontents failed! ${error}`);
        throw error;
    }
}

const getSplexConfig = async () => {
    try {
        const res = await axios.get('/api/splexconfig');
        return res.data.splexConfig;
    } catch (error) {
        console.warn(`get splexconfig failed! ${error}`);
        throw error;
    }
}

const getNetworkdiagram = async () => {
    try {
        const res = await axios.get('/api/networkdiagram', { responseType: 'blob' });
        return res.data;
    } catch (error) {
        console.warn(`get networkdiagram failed! ${error}`);
        throw error;
    }
}

const getEsbPorts = async () => {
    try {
        const res = await axios.get('/api/getesbports');
        return res.data.esbPortData;
    } catch (error) {
        console.warn(`get esbports failed! ${error}`);
        throw error;
    }
}

const updateEsbPorts = async (diffs) => {
    return axios
        .post('/api/updateesbports', { diffs })
        .then(res => {
            return res.data;
        })
        .catch(error => {
            console.warn(`post updateesbports failed! ${error}`);
            throw error;
            // return {};
        });
}

const getEmailConfig = async () => {
    try {
        const res = await axios.get('/api/emailconfig');
        return res.data.emailConfig;
    } catch (error) {
        console.warn(`get emailconfig failed! ${error}`);
        throw error;
    }
}

const updateEmailConfig = async (changes) => {
    return axios
        .post('/api/updateemailconfig', { changes })
        .then(res => {
            return res.data;
        })
        .catch(error => {
            console.warn(`post updateemailconfig failed! ${error}`);
            throw error;
        });
}

const getBatchSchemaConfig = async () => {
    try {
        const res = await axios.get('/api/batchschemaconfig');
        return res.data.schemaConfig;
    } catch (error) {
        console.warn(`get batchschemaconfig failed! ${error}`);
        throw error;
    }
}

const updateBatchSchemaConfig = async (diffs) => {
    return axios
        .post('/api/updatebatchschemaconfig', { diffs })
        .then(res => {
            return res.data;
        })
        .catch(error => {
            console.warn(`post updatebatchschemaconfig failed! ${error}`);
            throw error;
        });
}

const getFdrOptions = async () => {
    try {
        const res = await axios.get('/api/fdroptions');
        return res.data.fdrOptions;
    } catch (error) {
        console.warn(`get fdroptions failed! ${error}`);
        throw error;
    }
}

const getCurrentFdrConfig = async () => {
    return axios
        .get('/api/currfdrconfig')
        .then(res => {
            return res.data.currFdrConfig;
        })
        .catch(error => {
            console.warn(`get currfdrconfig failed! ${error}`);
            throw error;
            // return {};
        });
}

const updateFdrConfig = async (diffs) => {
    return axios
        .post('/api/updatefdrconfig', { diffs })
        .then(res => {
            return res.data;
        })
        .catch(error => {
            console.warn(`post updatefdrconfig failed! ${error}`);
            throw error;
        });
}

export {
    getJvms,
    getSchemas,
    getCurrentJvmSchemas,
    updateJvmSchemas,
    getJvmInfo,
    getEarContents,
    getOutboundStatus,
    getPropertiesContents,
    getSplexConfig,
    getNetworkdiagram,
    getEsbPorts,
    updateEsbPorts,
    getEmailConfig,
    updateEmailConfig,
    getBatchSchemaConfig,
    updateBatchSchemaConfig,
    getFdrOptions,
    getCurrentFdrConfig,
    updateFdrConfig
};
