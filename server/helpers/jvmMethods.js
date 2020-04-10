
// const { execPromise } = require('../utils/execPromise.js');
const fs = require('fs').promises;
const fsNP = require('fs');
const replace = require('replace-in-file');
const compareVersionsUtil = require('compare-versions');
let path = require('path');

const { getFileModifiedEpochMs, getLastModFileInDir } = require('../utils/fileUtils.js');
const { execPromise } = require('../utils/execPromise.js');
const { asyncForEach } = require('../utils/asyncForEach.js');
const { runOracleQuery } = require('../utils/oracleMethods.js');

const readConfigFileJSON = (filePath) => {
    try {
        const data = fsNP.readFileSync(filePath);
        try {
            const json = JSON.parse(data);
            return json;
        } catch (error) {
            console.error(`Error parsing json content from config file: ${filePath} Error: ${error}`);
        }
    } catch (error) {
        console.error(`Error reading config file: ${filePath} Error: ${error}`);
    }
}

// TODO add automatic reloading of config file or add to pm2 watch list
let config = readConfigFileJSON(process.env.CONFIG_FILE);
console.log(JSON.stringify(config, undefined, 2));

const buildJvmRootPath = (jvm) => {
    // return `${config.rssRoot}/${config.jvms[jvm]}/standalone/configuration/standalone-full.xml`;
    return `${config.rssRoot}/${config.jvms[ jvm ]}`;
}

const buildJvmConfigPath = (jvm) => {
    return `${buildJvmRootPath(jvm)}/standalone/configuration`;
}

const buildJvmConfigFilePath = (jvm) => {
    // return `${config.rssRoot}/${config.jvms[jvm]}/standalone/configuration/standalone-full.xml`;
    return `${buildJvmConfigPath(jvm)}/active_config`;
}

const createBounceTrigger = async (jvm) => {
    const bounceFilePath = `/tmp/${config.jvms[jvm]}/bounce_switch.dat`;
    const body = `BLAME_USER="s4_manager-dbconf"\nEMAIL=""\nTRIGGER_TIME="${new Date().toLocaleString()}"\n`;
    console.log(`Writing bounce trigger: ${bounceFilePath}`);
    try {
        await fs.writeFile(bounceFilePath, body);
        await fs.chmod(bounceFilePath, 0o777);
        console.log(`Bounce trigger created!`);
    } catch (error) {
        console.error(`Error writing bounce trigger: ${bounceFilePath} Error: ${error}`);
    }
};

// const schemaRx = new RegExp(`${config.dsName}.*<user-name>([a-zA-Z0-9]+)</user-name>`);
const schemaRx = new RegExp(`${config.dsName}[\\s\\S]*<user-name>([a-zA-Z0-9]+)</user-name>`);

const readCurrJvmSchemas = async () => {
    try {
        const rawResults = await Promise.all(Object.keys(config.jvms).map(async (jvm) => {
            const configFile = buildJvmConfigFilePath(jvm);
            // console.log(`configFile: ${configFile}`)
            const contents = await fs.readFile(configFile, 'utf8');
            const res = contents.match(schemaRx);
            // console.log(`START:::${contents}:::END`);
            // console.log(`RES: ${JSON.stringify(res,undefined,2)}`);
            if (res) {
                const schema = res[1];
                return { jvm, schema };
                // const obj = {};
                // obj[jvm] = schema;
                // return obj;
            } else {
                console.error(`Could not determine schema for jvm: ${jvm}`);
                return { jvm, schema: undefined };
                // const obj = {};
                // obj[jvm] = undefined;
                // return obj;
            }
            // return { jvm: schema };
        }));

        const results = {};
        rawResults.forEach(obj => {
            results[obj.jvm] = obj.schema;
        });

        return results;
    } catch (error) {
        console.error(`readCurrJvmSchemas: One or more promises failed to resolve. Error: ${error}`);
        return [];
    }
};

const runJvmCliCmd = async (jvm, cmd) => {
    const jvmFull = config.jvms[jvm];
    [ env, jvmNum ] = jvmFull.split('/'); // uat/jvm1 becomes uat, jvm1
    try {
        const cliOut = await execPromise(`${process.env.UNIT_CLI} ${env} ${jvmNum} ${cmd}`);
        console.log(`CLI Output: ${cliOut}`);
        return cliOut;
    } catch (error) {
        console.error(`runJvmCliCmd errored with code ${error.status} : `, error);
        throw error;
    }
}

const schemaRx2 = new RegExp(`(${config.dsName}[\\s\\S]*<user-name>)[a-zA-Z0-9]+(</user-name>[\\s\\S]*<password>)[^<]*(</password>)`);

const updateSingleJvmSchema = async (jvm, schema) => {

    const configFile = buildJvmConfigFilePath(jvm);

    const password = config.schemas[schema];

    let results;
    let updated = false;

    // If JVM is off, can update by updating config file directly, jvm online check not implemented hence the 1 === 2 to always skip
    if (1 === 2) {
        const options = {
            files: configFile,
            from: schemaRx2,
            to: `$1${schema}$2${password}$3`,
        };

        try {
            results = await replace(options);
            updated = true;
            console.log('Replacement results:', results);
        } catch (error) {
            console.error(`Replacement error occurred on jvm: ${jvm} :`, error);
            throw error;
        }
    } else {
        try {
            // Update jvm here
            results = await runJvmCliCmd(jvm, `-z ${schema},${password}`);
            updated = true;
            // console.log('CLI output:', results);
        } catch (error) {
            console.error(`Error invoking JVM CLI to updated user/pass on jvm: ${jvm} :`, error);
            throw error;
        }
    }

    if (updated) {
        await createBounceTrigger(jvm);
        return results;
    }

};

const updateJvmSchemas = async (diffs) => {
    console.log(`DIFFS: ${JSON.stringify(diffs, undefined, 2)}`);
    // Return values from the promise entries aren't actually being used, just checking if they are successful via the try catch logic, probably not ideal
    try {
        await Promise.all(Object.keys(diffs).map(async (jvm) => {
            return updateSingleJvmSchema(jvm, diffs[jvm]);
        }));
        return true;
    } catch (error) {
        console.error(`updateJvmSchemas: One or more promises failed to resolve. Error: ${error}`);
        return false;
    }
};

const httpPortRx = new RegExp('<socket-binding name="http" port=".*jboss.http.port:([0-9]+).*/>');

const fdrPortRx = new RegExp('fdr.endpointaddress=.*:([0-9]+)/');
const fdrFidRx = new RegExp('fdr.userid=([a-zA-Z0-9_]+)');

// gtmPort and gtmFid can have multiple entries for different service prefixes like af or scra
const gtmPortRx = new RegExp(/(.*)\.endpointAddress=.*:([0-9]+)\//g);
const gtmFidRx = new RegExp(/(.*)\.username=([a-zA-Z0-9_]+)/g);

const cuPortRx = new RegExp('cu.endpointAddress=.*:([0-9]+)/');

const readFdrConfigFile = async (jvm) => {
    const fdrPropFile = `${buildJvmConfigPath(jvm)}/fdr.properties`;
    const obj = {};
    try {
        const contents = await fs.readFile(fdrPropFile, 'utf8');

        const fdrPortRes = contents.match(fdrPortRx);
        // console.log(`fdrPortRes=${JSON.stringify(fdrPortRes, undefined, 2)}`);

        if (fdrPortRes) {
            const fdrPort = fdrPortRes[1];
            obj.fdrPort = fdrPort;
        } else {
            obj.fdrPort = undefined;
            console.error(`Could not determine fdrPort for jvm: ${jvm}`);
        }

        const fdrFidRes = contents.match(fdrFidRx);
        if (fdrFidRes) {
            const fdrFid = fdrFidRes[1];
            obj.fdrFid = fdrFid;
        } else {
            obj.fdrFid = undefined;
            console.error(`Could not determine fdrFid for jvm: ${jvm}`);
        }
    } catch (error) {
        console.error(`Could not retrieve fdr config from properties file: ${fdrPropFile} Error: ${error}`);
    } finally {
        return obj;
    }
}

const readJvmInfo = async () => {
    const results = {};
    try {
        const rawResults = await Promise.all(Object.keys(config.jvms).map(async (jvm) => {
            const obj = {};

            // Read standalone config file
            try {
                const configFile = buildJvmConfigFilePath(jvm);
                const contents = await fs.readFile(configFile, 'utf8');

                // Set schema info
                const schemaRes = contents.match(schemaRx);
                if (schemaRes) {
                    const schema = schemaRes[ 1 ];
                    obj.schema = schema;
                } else {
                    obj.schema = undefined;
                    console.error(`Could not determine schema for jvm: ${jvm}`);
                }

                // Set port info
                const portRes = contents.match(httpPortRx);
                // console.log(`portRes=${JSON.stringify(portRes, undefined, 2)}`);
                if (portRes) {
                    const intPort = portRes[ 1 ];
                    obj.intPort = intPort;
                } else {
                    obj.intPort = undefined;
                }

            } catch (error) {
                console.error(`Error reading config file: ${configFile} Error: ${error}`);
                if (! 'schema' in obj) {
                    obj.schema = undefined;
                }
                if (! 'intPort' in obj) {
                    obj.intPort = undefined;
                }
            }

            // Set logpath
            obj.logPath = `${config.exportRoot}/${config.jvms[ jvm ]}/log`;
            
            // Set last jvm bootup time
            const bootTrgFile = `${buildJvmRootPath(jvm)}/standalone/log/started.trg`;
            try {
                const startupTsMs = await getFileModifiedEpochMs(bootTrgFile);
                if (startupTsMs) {
                    obj.startupTsMs = startupTsMs;
                } else {
                    obj.startupTsMs = undefined;
                }
            } catch (error) {
                obj.startupTsMs = undefined;
                console.warn(`Could not retrieve last boot time from trigger: ${error}`);
            }

            try {
                const fdrObj = await readFdrConfigFile(jvm);
                obj.fdrPort = fdrObj.fdrPort;
                obj.fdrFid = fdrObj.fdrFid;
            } catch (err) {
                console.error(`Could not read FdrConfigFile for jvm: ${jvm}: `, err);
            }
            
            // Set GTM config
            obj.gtm = {};
            const gtmPropFile = `${buildJvmConfigPath(jvm)}/gtm.properties`;
            try {
                const contents = await fs.readFile(gtmPropFile, 'utf8');

                const gtmPortRes = contents.matchAll(gtmPortRx);
                if (gtmPortRes) {
                    for (const res of gtmPortRes) {
                        const gtmType = res[ 1 ]; // 'af' 'scra' etc.
                        const gtmPort = res[ 2 ];
                        if (!obj.gtm[gtmType]) {
                            obj.gtm[gtmType] = {};
                        }
                        obj.gtm[gtmType].gtmPort = gtmPort;
                    }
                } else {
                    // obj.gtmPort = undefined;
                    console.error(`Could not determine gtm ports for jvm: ${jvm}`);
                }

                const gtmFidRes = contents.matchAll(gtmFidRx);
                if (gtmFidRes) {
                    for (const res of gtmFidRes) {
                        const gtmType = res[ 1 ]; // 'af' 'scra' etc.
                        const gtmFid = res[ 2 ];
                        if (!obj.gtm[ gtmType ]) {
                            obj.gtm[ gtmType ] = {};
                        }
                        obj.gtm[ gtmType ].gtmFid = gtmFid;
                    }
                } else {
                    // obj.gtmFid = undefined;
                    console.error(`Could not determine gtm fids for jvm: ${jvm}`);
                }
            } catch (error) {
                console.error(`Could not retrieve gtm config from properties file: ${gtmPropFile} Error: ${error}`);
            }

            // Set CU config
            const cuPropFile = `${buildJvmConfigPath(jvm)}/cu_network_service.properties`;
            try {
                const contents = await fs.readFile(cuPropFile, 'utf8');

                const cuPortRes = contents.match(cuPortRx);
                if (cuPortRes) {
                    const cuPort = cuPortRes[ 1 ];
                    obj.cuPort = cuPort;
                } else {
                    obj.cuPort = undefined;
                    console.error(`Could not determine cuPort for jvm: ${jvm}`);
                }
            } catch (error) {
                console.error(`Could not retrieve cu config from properties file: ${cuPropFile} Error: ${error}`);
            }              

            const retObj = { jvm, obj };
            return retObj;
        }));

        rawResults.forEach(({ jvm, obj }) => {
            results[ jvm ] = obj;
        });

        // Read external port map file
        try {
            const contents = await fs.readFile(process.env.EXT_PORT_MAP_FILE, 'utf8');
            const lines = contents.split('\n').filter(Boolean); // Filter removes empty lines
            // console.log(`LINES: ${JSON.stringify(lines, undefined, 2)}`);
            lines.forEach(line => {
                // console.log(`LINE: ${line}`);
                if (line !== '') {
                    const [ env, jvmNum, extPort ] = line.split(/ +/);
                    // console.log(`env:${env} jvmNum:${jvmNum} extPort:${extPort}`);
                    if (env && jvmNum && extPort) {
                        const jvm = `${env}${jvmNum.charAt(jvmNum.length - 1)}`;
                        // console.log(`jvm:${jvm}`);
                        if (results[jvm]) {
                            // console.log(`Set results[${jvm}] extPort to ${extPort}`);
                            results[jvm].extPort = extPort;
                        }
                    }
                }
            });
        } catch (error) {
            console.error(`Could not retrieve external jvm ports from config file: ${process.env.EXT_PORT_MAP_FILE} Error:`, error);
        }

        // return results;
    } catch (error) {
        console.error(`readJvmInfo: One or more promises failed to resolve. Error: ${error}`);
    }    
    // return {};
    return results;
}

const readEarContentsFile = async (contentsFile) => {
    const earDetails = {}
    const contents = await fs.readFile(contentsFile, 'utf8');
    const lines = contents.split('\n')
        .filter(line => line && !line.match(/^-|^File.*Checksum/));

    let ear;
    lines.forEach((line, index) => {
        const [ artifact, checksum ] = line.split(/ +/);
        if (index === 0) {
            let version;
            [ ear, earVersion ] = artifact.replace('-', '&&&').split('&&&'); // The &&& is to only replace on the first hyphen. -SNAPSHOT means there can be multiple hyphens in an ear artifact entry.
            earVersion = earVersion.replace('.ear','');
            earDetails[ear] = {
                earVersion,
                earChecksum: checksum,
                againstProd: undefined, // Define this later
                lib: {}
            };
        } else {
            earDetails[ear].lib[artifact] = { checksum };
        }
    });
    
    return earDetails;
}

const readAllEarContentsInDir = async (earDir) => {
    const jvmObj = {};
    try {
        // Read filenames as objects, exclude directories, add full path onto it, return array of fullpath filenames
        const filesObj = await fs.readdir(earDir, { withFileTypes: true });
        const files = filesObj.filter(item => !item.isDirectory()).map(item => `${earDir}/${item.name}`);

        // Loop over each ear file in this directory
        // Don't try to return anything from asyncForEach, just set objects outside it directly
        await asyncForEach(files, async (file) => {
            const earDetails = await readEarContentsFile(file);
            // Extract the single child object from the outer {} returned by the readEarContentsFile method
            const [ artifact, detailsObj ] = Object.entries(earDetails)[ 0 ];
            jvmObj[ artifact ] = detailsObj;
        });
    } catch (error) {
        console.error(`Error reading directory: ${earDir} Error: `, error);
        throw error;
    }
    return jvmObj;
}

const compareVersions = (qaVersion, prodVersion) => {
    let againstProd;

    // This case shouldn't happen
    if (!qaVersion) {
        return 'UNKNOWN';
    }
    if (!prodVersion) {
        return 'NEW';
    } 
    if (qaVersion === prodVersion) {
        return 'SYNC';
    }
    const qaVersionNoSS = qaVersion.replace('-SNAPSHOT','');

    // This case is when QA has a snapshot deployed of the same version that's released in prod
    if (qaVersionNoSS === prodVersion) {
        return 'BEHIND';
    }

    const compRc = compareVersionsUtil(qaVersionNoSS, prodVersion);

    // Examples
    // compareVersionsUtil('10.1.8', '10.0.4'); //  1
    // compareVersionsUtil('10.0.1', '10.0.1'); //  0
    // compareVersionsUtil('10.1.1', '10.2.2'); // -1

    switch (compRc) {
        case -1:
            return 'BEHIND';
            break;
        case 0:
            return 'SYNC';
            break;
        case 1:
            return 'AHEAD';
            break;
        default:
            return 'UNKNOWN';
            break;
    }

    return 'UNKNOWN';
}

const getProdEarContents = async () => {
    const prodEarDir = process.env.PROD_EAR_CONTENTS_DIR;
    let prodObj;
    try {
        prodObj = await readAllEarContentsInDir(prodEarDir);
    } catch (error) {
        console.error(`A promise in readAllEarContentsInDir failed to resolve for prod : `, error);
    }
    return prodObj;
}

const getQAEarContents = async (prodObj) => {
    const qaObj = {};
    try {
        // Loop over each JVM
        const rawResults = await Promise.all(Object.keys(config.jvms).map(async (jvm) => {
            const jvmEarDir = `${config.exportRoot}/${config.jvms[jvm]}/ear`;

            let jvmObj;
            try {
                jvmObj = await readAllEarContentsInDir(jvmEarDir);
            } catch (error) {
                console.error(`A promise in readAllEarContentsInDir failed to resolve for jvm: ${jvm} : `, error);
            }

            return { jvm, jvmObj };
        }));


        rawResults.forEach(({ jvm, jvmObj }) => {
            qaObj[jvm] = jvmObj;
        });

        // Loop over all entries and determine if they are ahead, behind, or the same version as prod
        for (let [jvm, jvmObj] of Object.entries(qaObj)) {
            for (let [ear, earObj] of Object.entries(jvmObj)) {
                const qaVersion = earObj.earVersion;
                const prodVersion = prodObj[ear] ? prodObj[ear].earVersion : undefined;
                const againstProd = compareVersions(qaVersion, prodVersion);
                earObj.againstProd = againstProd;
            }
        }
    } catch (error) {
        console.error(`getEarContentsInfo: One or more promises failed to resolve. Error:`, error);
    }
    return qaObj;    
}

const getEarContentsInfo = async () => {
    const results = {};
    
    // Read prod ear contents
    const prodObj = await getProdEarContents();

    // Read each QA JVM's ear contents files, pass prod object to compare versions
    const qaObj = await getQAEarContents(prodObj);

    // Set final objects for return
    results.prod = prodObj;
    results.qa = qaObj;

    return results;
}

const runOutboundStatusScript = async () => {
    const outStatus = [];
    try {
        const cliOut = await execPromise(`${process.env.OUTBOUND_SH_SCRIPT} nopictures`);

        cliOut.split('\n').forEach(line => {
            const [type, env, nsPort, remoteIp, remotePort, soapStatus, telnetStatus] = line.trim().split(/\s+/);
            outStatus.push({
                type, env, nsPort, remoteIp, remotePort, soapStatus, telnetStatus
            });
        });
    } catch (error) {
        console.error(`runOutboundStatusScript errored with code ${error.status} : `, error);
        throw error;
    }
    return outStatus;
}

const credRx = new RegExp(/(.*password.*=|.*UserPass.*=|.*PasswordOverride.*=|.*pass.*=).*\n/, 'gi');
const credRepl = '$1*****\n';
const maskProperties = (contentsStr) => {
    if (!contentsStr) {
        return contentsStr;
    }
    return contentsStr.replace(credRx, credRepl);
}

const readMaskedPropertiesFiles = async () => {
    const allPropContents = {};
    const propExcludeRx = new RegExp(config.propExcludeRegex, 'i');

    // For each jvm
    await asyncForEach(Object.keys(config.jvms), async (jvm) => {
        const configPath = buildJvmConfigPath(jvm);
        // Read filenames as objects, exclude directories, add full path onto it, return array of fullpath filenames
        const filesObj = await fs.readdir(configPath, { withFileTypes: true });
        // filesObj.forEach(obj => console.log(`Name: ${obj.name}`));
        // Get all .properties files in the config directory, excluding a few we don't want to see on this
        const propFiles = filesObj.filter(item => {
            // console.log(`file:${item.name} ext:${path.extname(item.name)} isDir:${item.isDirectory()} matches: ${propExcludeRx.test(item.name)}`);
            return !item.isDirectory() 
                && path.extname(item.name).toLowerCase() === '.properties'
                && !propExcludeRx.test(item.name);
        }).map(item => `${configPath}/${item.name}`);

        const jvmObj = [];
        // For each properties file
        await asyncForEach(propFiles, async (propFile) => {
            // console.log(`propFile: ${propFile}`);
            const rawContents = await fs.readFile(propFile, 'utf8');
            const maskedContents = maskProperties(rawContents);
            jvmObj.push({
                file: path.basename(propFile),
                contents: maskedContents
            });
        });
        allPropContents[jvm] = jvmObj;
    });

    // console.log(`allPropContents: ${JSON.stringify(allPropContents, undefined, 2)}`);

    return allPropContents;
}

const dsRx = new RegExp('^Datasource:');
const sourceRx = new RegExp('^#?Source Table');
const wsRx = new RegExp(' +');

const splitSplexToObj = (splexStr) => {
    const lines = splexStr.split('\n');
    let datasource = '';
    const entries = [];
    lines.forEach(line => {
        if (!line)
            return;
        if (dsRx.test(line)) {
            datasource = line.split(':')[1];
        } else if (!sourceRx.test(line)) {
            const fields = line.split(wsRx);
            if (fields.length === 5) {
                entries.push({
                    sourceTable: fields[0],
                    keyDef: fields[2].replace(/[()]*/g, ''),
                    destTable: fields[3],
                    routingMap: fields[4]
                });
            } else {
                entries.push({
                    sourceTable: fields[0],
                    keyDef: '(PRIMARY_KEY)',
                    destTable: fields[1],
                    routingMap: fields[2]
                });
            }
        }
    });
    return { datasource, entries };
}

const getSplexConfig = async () => {
    const splexDir = process.env.SPLEX_DIR;
    const splex = {};
    try {
        const splexFileObj = await getLastModFileInDir(splexDir, 's4_v.*');
        const rawContents = await fs.readFile(splexFileObj.file, 'utf8');
        const contents = splitSplexToObj(rawContents);
        splex.fileObj = splexFileObj;
        splex.contents = contents;
    } catch (error) {
        console.error(`getSplexConfig errored: `, error);
    }
    return splex;
}

const esbPortQuery = `select * from config_properties_tb where ax_request_type = 'ESB Port Type'`;

// This returns both the port set for each jvm in each schema but also the available list of esb ports to set them to
const getEsbPorts = async () => {
    const schemaPorts = {};
    try {
        await Promise.all(Object.keys(config.schemas).map(async (schema) => {
            const resultArr = await runOracleQuery(config, schema, esbPortQuery);
            if (resultArr) {
                const tmp = {};
                // Reformat the returned rows into object with "jvm: port" objects inside
                resultArr.rows.forEach(row => {
                    const jvm = row.AX_PROPERTY_NAME;
                    const port = row.AX_PROPERTY_VALUE;
                    tmp[jvm] = port;
                });
                schemaPorts[schema] = tmp;
            } else {
                console.error(`Could not determine ports for schema: ${schema}`);
            }
        }));
        console.log(`schemaPorts: ${JSON.stringify(schemaPorts, undefined, 2)}`);

        return {
            currPorts: schemaPorts,
            allPorts: config.esbPorts
        }
    } catch (error) {
        console.error(`readCurrJvmSchemas: One or more promises failed to resolve. Error: ${error}`);
        return schemaPorts;
    }
}

const esbPortUpdateQuery = `update config_properties_tb set ax_property_value = :port where ax_request_type = 'ESB Port Type' and ax_property_name = :jvm`;

const updateSingleEsbPort = async (jvm, schema, newPort) => {

    let results;

    try {
        // Update DB here
        const params = {
            jvm,
            port: newPort
        };
        // console.log(`await runOracleQuery(config, ${schema}, esbPortUpdateQuery, ${JSON.stringify(params)});`);
        // const resultArr = [];
        const resultArr = await runOracleQuery(config, schema, esbPortUpdateQuery, params);
        console.log(`resultArr: ${JSON.stringify(resultArr, undefined, 2)}`);

        return resultArr.rowsAffected;
    } catch (error) {
        console.error(`Error updating ESB port for jvm: ${jvm} on schema: ${schema} :`, error);
        throw error;
    }

};

const updateEsbPorts = async (diffs) => {
    console.log(`DIFFS: ${JSON.stringify(diffs, undefined, 2)}`);
    // Return values from the promise entries aren't actually being used, just checking if they are successful via the try catch logic, probably not ideal
    try {
        const schemas = Object.keys(diffs);
        const updateMap = {};
        
        // Don't try to return anything from asyncForEach, just set objects outside it directly if needed
        await asyncForEach(schemas, async (schema) => {
            const jvms = Object.keys(diffs[schema]);
            await asyncForEach(jvms, async (jvm) => {
                const newPort = diffs[schema][jvm];
                console.log(`Calling updateSingleEsbPort on ${schema}:${jvm} for port: ${newPort}`);
                const rowsAffected = await updateSingleEsbPort(jvm, schema, newPort);
                if (rowsAffected && rowsAffected > 0) {
                    updateMap[jvm] = schema;
                }
            });
        });

        const currJvmSchemas = await readCurrJvmSchemas();
        console.log(`updateMap = ${JSON.stringify(updateMap, undefined, 2)}`);
        console.log(`currJvmSchemas = ${JSON.stringify(currJvmSchemas, undefined, 2)}`);
        // Compare each current setting to see if it has an entry in the updateMap, if so, create bounce trigger
        for (let [jvm, schema] of Object.entries(updateMap)) {
            // Convert "uat_jvm1" -> "uat1" so formats match
            const shortJvm = jvm.replace('_jvm', '');
            if (currJvmSchemas[shortJvm] === schema) {
                console.log(`Creating bounce trigger for: ${shortJvm} -> ${schema}`);
                createBounceTrigger(shortJvm);
            }
        }

        return true;
    } catch (error) {
        console.error(`updateJvmSchemas: One or more promises failed to resolve. Error: ${error}`);
        return false;
    }
};

// Currently allowed to ssh to s4qa@xcla9565 and prod@xlla9583 (from which you could theoretically ssh to 9565 as well...)
const runRemoteSSHCommand = async (server, user, cmd) => {
    try {
        // console.log(`ssh -q ${user}@${server} '${cmd}'`)
        const cliOut = await execPromise(`ssh -q ${user}@${server} '${cmd}'`);
        // console.log(`CLI Output: ${cliOut}`);
        return cliOut;
    } catch (error) {
        console.error(`runRemoteSSHCommand errored with code ${error.status} : `, error);
        throw error;
    }
}

const sortEmailPortfolios = (first, second) => {
    const port1 = first.portfolio.toLowerCase();
    const port2 = second.portfolio.toLowerCase();
    if (port1 === 'default') {
        return -1;
    }
    if (port2 === 'default') {
        return 1;
    }
    if (port1 < port2) {
        return -1;
    }
    if (port1 > port2) {
        return 1;
    }

    // names must be equal
    return 0;
}

const readRemoteEmailConfigFiles = async (hostname, sshUser, envs) => {
    const filename = 'combined_emails_master.cfg';
    try {
        // We prepend and append === lines so we can separate each files output and also include some meta info about the file in the START line
        const out = await runRemoteSSHCommand(hostname, sshUser,
            `for env in ${envs}; do
                emaildir=${config.basepathMount}/$env/config/emails;
                if [ -d $emaildir ]; then
                    for portdir in $(find ${config.basepathMount}/$env/config/emails -maxdepth 1 -mindepth 1 -type d); do
                        emailfile=$portdir/${filename};
                        if [ -f $emailfile ]; then
                            port=$(basename $portdir);
                            echo "=== START $env $port $emailfile ===";
                            cat $emailfile;
                            echo "=== END ===";
                        fi;
                    done;
                fi;
            done`);
        // console.log(out);

        const allFilesContentsArr = out.split('=== END ===\n');
        // console.warn(`${JSON.stringify(allFilesContentsArr, undefined, 2)}`);

        const allFiles = allFilesContentsArr.map(fileContentsWithHeader => {
            // Filter ignores empty lines and also lines that are commented
            let lines = fileContentsWithHeader.split('\n').filter(Boolean).filter(el => !/^ *#/.test(el));

            // Pull header
            const header = lines.shift();

            // Extra filter to only includes those with pipes in them
            lines = lines.filter(el => /\|/.test(el));

            // Remove header from block of text
            const fileContents = fileContentsWithHeader.replace(/=== START.*\n/, '');

            // Extract meta info from header
            const [env, portfolio, emailFileFP] = header.split(' ').filter(el => !/===|START/.test(el));
            // console.log(`env: ${env} port: ${portfolio} emailFile: ${emailFileFP}`);
            // console.log(`header: ${header}\n\nlines: ${JSON.stringify(lines, undefined, 2)}\n\nfileContents: ${fileContents}\n\n`);

            return { env, portfolio, emailFileFP, contentLines: lines, rawfileContents: fileContents };
        }).sort(sortEmailPortfolios);

        return allFiles;
        // console.log(JSON.stringify(allFiles, undefined, 2));
    } catch (err) {
        console.error(`Error calling runRemoteSSHCommand(): `, err);
    }
}

const getEmailSSHVars = instance => {
    let hostname, sshUser, envs;
    if (instance === 'prod') {
        hostname = 'xcla9565';
        sshUser = 's4qa';
        envs = 'prod';
    } else if (instance === 'qa') {
        hostname = 'xlla9583';
        sshUser = 'prod';
        envs = config.batchEnvs.join(' ');
    } else {
        throw new Error(`getEmailSSHVars: instance must be 'qa' or 'prod'!`);
    }
    return [ hostname, sshUser, envs ];
}

const readInstanceEmailConfigFiles = async (instance) => {
    const [hostname, sshUser, envs] = getEmailSSHVars(instance);

    try {
        const instanceConfig = await readRemoteEmailConfigFiles(hostname, sshUser, envs);
        return instanceConfig;
    } catch (err) {
        console.error(`Error calling readRemoteEmailConfigFiles(): `, err);
    }
}

const readAllEmailConfigFiles = async () => {
    const emailConfig = {};
    await asyncForEach(['qa', 'prod'], async (instance) => {
        const instanceConfig = await readInstanceEmailConfigFiles(instance);
        // console.log(instanceConfig);
        emailConfig[instance] = instanceConfig;
    });
    // console.log(JSON.stringify(qa));
    return emailConfig;
}

const updateSingleEmailFile = async (instance, env, portfolio, shortAlias, emailFileFP, emails) => {
    console.log(`Do an async file replacement operation here: ${instance} ${env} ${portfolio} ${shortAlias} ${emailFileFP} ::: ${emails}`);

    let [hostname, sshUser] = getEmailSSHVars(instance);
    if (instance !== 'prod') {
        // We have ssh keys to the QA users so use those to ssh.
        sshUser = env;
    }
    // sed -r = regex, -i.bkup = replace in place and create a file with "bkup" extension, -c makes it perform a copy rather than replace
    const cmd = `sed -rc -i.bkup.$(date +%Y%m%d.%H%M%S) "s/^(${shortAlias}\\|[^|]*\\|).*$/\\1${emails}/" ${emailFileFP}`;
    console.log(`Running cmd: ${cmd}`);
    try {
        const out = await runRemoteSSHCommand(hostname, sshUser, cmd);
        // console.log(`out: ${out}`);
        return true;
    } catch (err) {
        console.error(`Error running ssh sed command: `, err);
        return false;
    }
}

const updateEmailConfig = async (changes) => {
    // console.log(`CHANGES: ${JSON.stringify(changes, undefined, 2)}`);
    let allSuccessful = true;
    await asyncForEach(Object.values(changes), async (obj) => {
        const successful = await updateSingleEmailFile(obj.instance, obj.env, obj.portfolio, obj.shortAlias, obj.emailFileFP, obj.emails);
        if (!successful) {
            allSuccessful = false;
        }
    });
    return allSuccessful;
}

const readRemoteSchemaConfigFiles = async () => {
    const hostname = 'xlla9583';
    const sshUser = 'prod';
    const envs = config.batchEnvs.join(' ');

    const filename = 'schemas_master.cfg';
    try {
        // Doing something a bit different with this one. We're attempting to have the shell command return formatted JSON so we can parse straight to an object.
        let out = await runRemoteSSHCommand(hostname, sshUser,
            `echo "{";
    for env in ${envs}; do
        schemaFile=${config.basepathMount}/$env/config/${filename};
        if [ -f $schemaFile ]; then
            echo "    \\"$env\\": {"
            echo "        \\"schemaFileFP\\": \\"$schemaFile\\","
            echo "        \\"contents\\": \\"$(cat $schemaFile)\\""
            echo "    },"
        fi;
    done | sed "$ s|,||"; # Remove trailing comma from last object
echo "}"; `);

        // Replace all the actual newlines in the file contents portion with the characters \n so it can be parsed into JSON
        out = out.replace(/([a-zA-Z0-9_]+)\n/g, '$1\\n');
        // console.log(`OUT: ${out}`);

        try {
            const outObj = JSON.parse(out);

            // This block parses the file contents into a set of nested objects with entries for each line in the file
            for (let [env, obj] of Object.entries(outObj)) {
                const contentLines = obj.contents.split('\n');
                const entries = {};
                // Entries will contain a list of objects where "$id": [ schema1, schema2, ... ],
                contentLines.forEach(line => {
                    const [ id, schemasStr ] = line.split('|');
                    entries[id] = schemasStr.split(/\s+/);
                });
                obj.entries = entries;
            }

            return outObj;
            // console.log(`OUTOBJ: ${JSON.stringify(outObj, undefined, 4)}`);
        } catch (err) {
            console.error(`Error parsing schema JSON from ssh command: `, err);
            throw err;
        }
    } catch (err) {
        console.error(`Error calling runRemoteSSHCommand(): `, err);
        return {};
    }
}

const sortSchemas = (a, b) => {
    if (a === 'utmay') {
        return -1;
    } else if (b === 'utmay') {
        return 1;
    }
    return a.toLowerCase().localeCompare(b.toLowerCase());
};

const updateSingleRemoteSchemaConfigFile = async (env, schemaFileFP, entries) => {
    console.log(`Do an async file replacement operation here: ${env} ${schemaFileFP} ::: ${JSON.stringify(entries, undefined, 2)}`);

    const hostname = 'xlla9583';
    const sshUser = env;

    let lines = '';


    for (const [id, schemas] of Object.entries(entries)) {
        // Make sure the schemas are always orderd utmay, s4qap1, ...
        lines += `${id}|${schemas.sort(sortSchemas).join(' ')}\n`;
    };

    // sed -r = regex, -i.bkup = replace in place and create a file with "bkup" extension, -c makes it perform a copy rather than replace
    const cmd = `date=$(date +%Y%m%d.%H%M%S);
echo "${lines}" | egrep -v "^ *$" | while read LINE; do
    id=$(echo "$LINE" | awk -F"|" "{print \\$1}" );
    #echo "id=$id";
    #echo "LINE=$LINE";
    sed -c -i.bkup.$date "s/^$id|.*$/$LINE/g" ${schemaFileFP};
done`;
    console.log(`Running cmd: ${cmd}`);
    try {
        const out = await runRemoteSSHCommand(hostname, sshUser, cmd);
        console.log(`out: ${out}`);
        return true;
    } catch (err) {
        console.error(`Error running ssh sed command: `, err);
        return false;
    }
}

const updateRemoteSchemaConfigFiles = async (diffs) => {
    try {
        const resArr = await Promise.all(Object.keys(diffs).map(async (env) => {
            return updateSingleRemoteSchemaConfigFile(env, diffs[env].schemaFileFP, diffs[env].entries);
        }));
        return resArr.every(Boolean);
    } catch (error) {
        console.error(`updateRemoteSchemaConfigFiles: One or more promises failed to resolve. Error: ${error}`);
        return false;
    }
}

const readCurrFdrConfig = async () => {
    const currFdrConfig = {};
    await asyncForEach(Object.keys(config.jvms), async (jvm) => {
        try {
            const fdrObj = await readFdrConfigFile(jvm);
            const obj = {};
            obj.fdrPort = fdrObj.fdrPort;
            obj.fdrFid = fdrObj.fdrFid;
            currFdrConfig[jvm] = obj;
        } catch (err) {
            console.error(`Could not read FdrConfigFile for jvm: ${jvm}: `, err);
        }
    });
    return currFdrConfig;
}

const fdrPortRx2 = new RegExp('(fdr.endpointaddress=.*:)[0-9]+');
const fdrFidRx2 = new RegExp('(fdr.userid=)[a-zA-Z0-9_]+');

const updateFdrConfigFile = async (jvm, fdrPort, fdrFid) => {
    const fdrPropFile = `${buildJvmConfigPath(jvm)}/fdr.properties`;

    if (!fdrPort && !fdrFid) {
        return false;
    }

    const from = [];
    const to = [];

    if (fdrPort) {
        from.push(fdrPortRx2);
        to.push(`$1${fdrPort}`);
    }
    if (fdrFid) {
        from.push(fdrFidRx2);
        to.push(`$1${fdrFid}`);
    }

    const options = {
        files: fdrPropFile,
        from,
        to
    };

    try {
        const results = await replace(options);
        // results object looks like the below:
        // [
        //   {
        //     file: 'path/to/files/file1.html',
        //     hasChanged: true,
        //   },
        //   {
        //     file: 'path/to/files/file2.html',
        //     hasChanged: true,
        //   },
        //   {
        //     file: 'path/to/files/file3.html',
        //     hasChanged: false,
        //   },
        // ]
        console.log('Replacement results:', results);
        return true;
    } catch (error) {
        console.error(`Replacement error occurred on jvm: ${jvm} :`, error);
        return false;
    }
}

const updateFdrConfig = async (diffs) => {
    console.log(`DIFFS: ${JSON.stringify(diffs, undefined, 2)}`);

    try {
        const resArr = await Promise.all(Object.keys(diffs).map(async (jvm) => {
            return updateFdrConfigFile(jvm, diffs[jvm].fdrPort, diffs[jvm].fdrFid);
        }));
        return resArr.every(Boolean);
    } catch (error) {
        console.error(`updateRemoteSchemaConfigFiles: One or more promises failed to resolve. Error: ${error}`);
        return false;
    }
}

module.exports = {
    config,
    buildJvmRootPath,
    buildJvmConfigFilePath,
    createBounceTrigger,
    readCurrJvmSchemas,
    updateJvmSchemas,
    readJvmInfo,
    getEarContentsInfo,
    runOutboundStatusScript,
    readMaskedPropertiesFiles,
    getSplexConfig,
    getEsbPorts,
    updateEsbPorts,
    readAllEmailConfigFiles,
    updateEmailConfig,
    readRemoteSchemaConfigFiles,
    updateRemoteSchemaConfigFiles,
    readCurrFdrConfig,
    updateFdrConfig
}