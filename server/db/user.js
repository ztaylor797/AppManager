const sqlite3 = require('sqlite3').verbose();

const usersDbFileName = process.env.USERS_DB || './users.db';
const authdb = new sqlite3.Database(usersDbFileName, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Connected to file-based SQlite database: users.db`);
});

const createUsersTable = () => {
    const sqlQuery = `
        CREATE TABLE IF NOT EXISTS users (
        id integer PRIMARY KEY,
        userid UNIQUE,
        name text,
        email text UNIQUE,
        registeredTs DATETIME,
        lastAccessTs DATETIME)`;

    return authdb.run(sqlQuery);
}
createUsersTable();

const findUserByEmail = (email, cb) => {
    return authdb.get(`SELECT * FROM users WHERE email = ?`, [ email ], (err, row) => {
        cb(err, row)
    });
}

const findUserByUserid = (userid, cb) => {
    return authdb.get(`SELECT * FROM users WHERE userid = ?`, [ userid ], (err, row) => {
        cb(err, row)
    });
}

const createUser = (user, cb) => {
    return authdb.run('INSERT INTO users (userid, name, email, registeredTs, lastAccessTs) VALUES (?,?,?,?,?)', user, (err) => {
        cb(err)
    });
}

module.exports = {
    findUserByEmail,
    findUserByUserid,
    createUser
}