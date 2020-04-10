const oracledb = require('oracledb');

// Fetch results as JSON object
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

async function runOracleQuery (config, schema, query, params = {}) {
    let connection;
    let results;
    try {
        connection = await oracledb.getConnection({
            user: schema,
            password: config.schemas[schema],
            connectString: config.dbConnectionString
        });
        console.log(`Connected.`);

        try {
            results = await connection.execute(query, params);
            // console.log(JSON.stringify(results, undefined, 2));
            return results;
        } catch (error) {
            console.error(`Error executing query: `, error);
            throw error;
        }
    } catch (error) {
        console.error(`Error connecting to ${schema}: `, error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log(`Connection closed.`);
            } catch (error) {
                console.error('Error closing connection: ', error);
                throw error;
            }
        }
    }
}

module.exports = {
    runOracleQuery
}