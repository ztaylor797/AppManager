// Note that currently these API methods don't follow REST based on their naming convention and such

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
var tableify = require("tableify");

const { verifyCookies } = require('./auth.js');
const { config, readCurrJvmSchemas, updateJvmSchemas, readJvmInfo, getEarContentsInfo, runOutboundStatusScript, readMaskedPropertiesFiles, getSplexConfig, getEsbPorts, updateEsbPorts, readAllEmailConfigFiles, updateEmailConfig, readRemoteSchemaConfigFiles, updateRemoteSchemaConfigFiles, readCurrFdrConfig, updateFdrConfig } = require('../helpers/jvmMethods.js');
const { sendNotification } = require('../utils/email.js');

router.get('/api/jvmlist', verifyCookies, (req, res, next) => {
    res.json({ 
        jvms: Object.keys(config.jvms)
    });
    // console.log('JVMs sent!');
});

// { jvms: [ "uat1", "uat2", ... ] }

router.get('/api/schemalist', verifyCookies, (req, res, next) => {
    res.json({
        schemas: Object.keys(config.schemas)
    });
    // console.log('Schemas sent!');
});

router.get('/api/currjvmschemas', verifyCookies, async (req, res, next) => {
    res.json({
        currJvmSchemas: await readCurrJvmSchemas()
    });
    // console.log('Current JVM schemas sent!');
});

router.post('/api/updatejvmschemas', verifyCookies, async (req, res, next) => {
    console.log('Updating schemas...');
    const submittedAt = new Date();

    // Do schema update here
    // console.log(JSON.stringify(req.body, undefined, 2));
    const successful = await updateJvmSchemas(req.body.diffs);

    res.json({
        currJvmSchemas: await readCurrJvmSchemas(),
        successful
    });
    // console.log('Current JVM schemas sent!');

    sendNotification('Update JVM Schema Config', successful, submittedAt, `${tableify(req.body.diffs)}`, req);
});

router.get('/api/jvminfo', verifyCookies, async (req, res, next) => {
    res.json({
        jvmInfo: await readJvmInfo()
    });
    // console.log('Current JVM schemas sent!');
});

router.get('/api/earcontents', verifyCookies, async (req, res, next) => {
    res.json({
        earContents: await getEarContentsInfo()
    });
});

router.get('/api/outboundstatus', verifyCookies, async (req, res, next) => {
    res.json({
        outboundStatus: await runOutboundStatusScript()
    });
});

router.get('/api/propertiescontents', verifyCookies, async (req, res, next) => {
    res.json({
        allPropContents: await readMaskedPropertiesFiles()
    });
});

router.get('/api/splexconfig', verifyCookies, async (req, res, next) => {
    res.json({
        splexConfig: await getSplexConfig()
    });
});

router.get('/api/networkdiagram', verifyCookies, async (req, res, next) => {
    try {
        const data = await fs.readFile(`${process.env.PDF_DIR}/latest_network_diagram`);
        res.contentType("application/pdf");
        res.send(data);
    } catch (error) {
        console.error(`Error in get networkdiagram: `, error);
        next(error);
    }
});

router.get('/api/getesbports', verifyCookies, async (req, res, next) => {
    res.json({
        esbPortData: await getEsbPorts()
    });
});

router.post('/api/updateesbports', verifyCookies, async (req, res, next) => {
    console.log('Updating ESB ports...');
    const submittedAt = new Date();

    console.log(JSON.stringify(req.body.diffs, undefined, 2));
    const successful = await updateEsbPorts(req.body.diffs);

    res.json({
        esbPortData: await getEsbPorts(),
        successful
    });

    sendNotification('Update ESB Port Config', successful, submittedAt, `${tableify(req.body.diffs)}`, req);
});

router.get('/api/emailconfig', verifyCookies, async (req, res, next) => {
    res.json({
        emailConfig: await readAllEmailConfigFiles()
    });
});

router.post('/api/updateemailconfig', verifyCookies, async (req, res, next) => {
    console.log('Updating email config...');
    const submittedAt = new Date();

    // console.log(JSON.stringify(req.body.changes, undefined, 4));
    const successful = await updateEmailConfig(req.body.changes);

    res.json({
        emailConfig: await readAllEmailConfigFiles(),
        successful
    });

    sendNotification('Update citimaildist Email Config', successful, submittedAt, `${tableify(req.body.changes)}`, req);
});

router.get('/api/batchschemaconfig', verifyCookies, async (req, res, next) => {
    res.json({
        schemaConfig: await readRemoteSchemaConfigFiles()
    });
});

router.post('/api/updatebatchschemaconfig', verifyCookies, async (req, res, next) => {
    console.log('Updating batch schema config...');
    const submittedAt = new Date();

    const successful = await updateRemoteSchemaConfigFiles(req.body.diffs);

    res.json({
        schemaConfig: await readRemoteSchemaConfigFiles(),
        successful
    });

    sendNotification('Update Batch Schema Config', successful, submittedAt, `${tableify(req.body.diffs)}`, req);
});

router.get('/api/fdroptions', verifyCookies, (req, res, next) => {
    res.json({
        fdrOptions: {
            ports: config.fdrPorts,
            fids: config.fdrFids
        }
    });
    // console.log('Schemas sent!');
});

router.get('/api/currfdrconfig', verifyCookies, async (req, res, next) => {
    res.json({
        currFdrConfig: await readCurrFdrConfig()
    });
    // console.log('Current JVM schemas sent!');
});

router.post('/api/updatefdrconfig', verifyCookies, async (req, res, next) => {
    console.log('Updating FDR config...');
    // Do schema update here
    // console.log(JSON.stringify(req.body, undefined, 2));
    const submittedAt = new Date();

    const successful = await updateFdrConfig(req.body.diffs);

    res.json({
        currFdrConfig: await readCurrFdrConfig(),
        successful
    });
    // console.log('Current JVM schemas sent!');

    sendNotification('Update FDR Config', successful, submittedAt, `${tableify(req.body.diffs)}`, req);
});

module.exports = {
    router
};