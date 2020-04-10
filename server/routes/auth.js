const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
var tableify = require("tableify");

const { execPromise } = require('../utils/execPromise.js');
const { findUserByEmail, findUserByUserid, createUser } = require('../db/user.js');
const { sendAdminNotification } = require('../utils/email.js');

const SECRET_KEY = process.env.SOME_LONG_UNGUESSABLE_STRING;

Object.defineProperty(Date.prototype, "convertDateToLogDate", {
    value: function () {
        const dt = this;

        let dd = dt.getDate();
        let mm = dt.getMonth() + 1;
        const yyyy = dt.getFullYear();

        let hour = dt.getHours();
        let min = dt.getMinutes();
        let sec = dt.getSeconds();

        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        if (hour < 10) {
            hour = '0' + hour;
        }
        if (min < 10) {
            min = '0' + min;
        }
        if (sec < 10) {
            sec = '0' + sec;
        }
        return `${yyyy}-${mm}-${dd} ${hour}:${min}:${sec}`;
    }
});

// Auth API
const authViaLdaps = async (userid, password, cb) => {
    let authResult = false;
    const attrs = {};

    const passwordFile = `${process.env.TMP_PATH}/${userid}.pass`;
    // Write password to temp file to pass to java command without exposing on the process table
    await fs.writeFile(passwordFile, password, { mode: 0o700 });

    try {
        // Doing this via java because couldn't get ldap to work with node
        const authOut = await execPromise(`/usr/bin/java -cp ${process.env.ADAUTH_JAR_PATH} com.acxiom.solvitur4.adauth.ADAuthTest ${process.env.AD_DOMAIN} ${userid} ${passwordFile} ${process.env.AD_PROP_PATH}`);
        console.log(authOut);
        
        // Delete temp file
        fs.unlink(passwordFile, err => console.error(err));

        authOut.split('\n').forEach(line => {

            const arr = line.split(': ');
            if (arr[0] === 'Auth') {
                if (arr[1] === "true") {
                    authResult = true;
                }
            } else if (arr[0] === 'Attrs') {
                const fieldsArr = line.replace('Attrs: {', '').replace('}', '').replace(/[a-zA-Z_]+=/g, '').split(',');
                fieldsArr.forEach(el => {
                    const elArr = el.split(': ');
                    const key = elArr[0].trim();
                    const value = elArr[1].trim();
                    attrs[key] = value;
                });
            }
        });
        console.log(JSON.stringify({ authResult, attrs }, undefined, 2));
        return { authResult, attrs };
    } catch (err) {
        console.error(err);
        return false;
    }

}

const createSplitAccessToken = (user, expiresIn = '1h') => {
    const accessToken = jwt.sign(
        { ...user },
        SECRET_KEY,
        { 
            expiresIn,
            jwtid: uuidv4()
        }
    );
    // Split jwt into two parts so we can send it as two separate cookies
    const arr = accessToken.split(/\./);
    return {
        hpayload: `${arr[0]}.${arr[1]}`,
        signature: arr[2]
    };
}

router.post('/api/users', (req, res) => {
    const email = req.body.email;
    const userid = req.body.userid;
    
    let method, param;
    if (email) {
        method = findUserByEmail;
        param = email;
    } else if (userid) {
        method = findUserByUserid;
        param = userid;
    } else {
        res.status(400).send({
            "user_found": false
        });
        return;
    }

    method(param, (err, user) => {
        if (err) return res.status(500).send('Server error!');
        found = user ? true : false;
        // console.log(`User search for ${user} returned: ${found}`);

        res.status(200).send({
            "user_found": found
        });
    });
});

// router.post('/api/register', async (req, res) => {
//     // console.log(JSON.stringify(req.body, undefined, 2));

//     const userid = req.body.userid;
//     const name = req.body.name;
//     const email = req.body.email;
//     const password = req.body.password;

//     // const password = bcrypt.hashSync(req.body.password);
    
//     console.log(`/api/register ${userid}`);
//     const { authResult, attrs } = await authViaLdaps(userid, password);
    
//     console.log(`result: ${authResult}`);
//     if (!authResult) {
//         return res.status(401).send('Invalid password!'); 
//     }

//     // Check if the user already exists
//     findUserByUserid(userid, async (err, user) => {
//         if (user) {
//             console.error(`User already exists and attempted to re-register: ${userid}`);
//             return res.status(405).send('User already registered!');
//         } else {
//             // userid, name, email, registeredTs, lastAccessTs
//             createUser([ userid, name, email, new Date().convertDateToLogDate(), new Date().convertDateToLogDate() ], (err) => {
//                 if (err) return res.status(500).send("Server error!");

//                 sendAdminNotification('New User Registered!', `<p>New user registered.</p>${tableify({ userid, name, email })}</pre>`);
//                 // TODO notify here
//                 res.status(200).send({ registrationSuccessful: true });
//                 // Client should redirect to login
//             });
//         }
//     });

// });

const hour = 3600000;
const setTokenCookies = (res, user, rememberMe) => {
    // console.log(`RememberMe: ${rememberMe}`);
    const splitAccessToken = createSplitAccessToken(user, rememberMe ? '7d' : '1hr');
    const expireDate = rememberMe ? new Date(new Date().getTime() + hour * 24 * 7) : new Date(new Date().getTime() + hour);
    // console.log(`Expiration Date: ${expireDate}`)
    res.cookie('hpayloadCookie', splitAccessToken.hpayload, {
        // secure: true,
        // user,
        sameSite: true,
        // maxAge: rememberMe ? hour * 24 * 7 : hour // One week if rememberMe is set, otherwise one hour
        expires: expireDate
    });
    res.cookie('signatureCookie', splitAccessToken.signature, {
        httpOnly: true,
        // secure:true,
        sameSite: true,
        expires: new Date('2038-01-19 04:14:07') // Distant future
    });
    // console.log(JSON.stringify(res.cookies, undefined, 2));
};

router.post('/api/login', async (req, res) => {
    const userid = req.body.userid;
    const password = req.body.password;
    const rememberMe = req.body.rememberMe;

    const { authResult, attrs } = await authViaLdaps(userid, password);
    const name = attrs.cn;
    const email = attrs.mail;

    if (!authResult) {
        console.error(`Ldap password not valid for user: ${userid}`);
        return res.status(401).send('Password not valid!');
    }
    console.log(`Login for ${userid} passed AD auth!`);

    findUserByUserid(userid, async (err, user) => {
        if (err) {
            console.error(`Error when trying to find user by id: ${err}`);
            return res.status(500).send('Server error!');
        }
        if (user) {
            setTokenCookies(res, user, rememberMe);
            res.status(200).send('Login successful!');
        } else {   
            console.log(`User not found, creating new user... ${JSON.stringify({ userid, name, email })}`);         
            // userid, name, email, registeredTs, lastAccessTs
            createUser([userid, name, email, new Date().convertDateToLogDate(), new Date().convertDateToLogDate()], (err) => {
                if (err) return res.status(500).send("Server error!");
                sendAdminNotification('New User Registered!', `<p>New user registered.</p>${tableify({ userid, name, email })}</pre>`);
                // TODO notify here
                // res.status(200).send({ registrationSuccessful: true });
                // Client should redirect to login
                findUserByUserid(userid, async (err, user) => {
                    setTokenCookies(res, user, rememberMe);
                    res.status(200).send('Registration and login successful!');                    
                });                
            });
        }
    });
});

// Verify the token
function verifyToken(hpayloadCookie, signatureCookie)
{
    return jwt.verify(`${hpayloadCookie}.${signatureCookie}`, SECRET_KEY);
}

// TODO This method shares a lot of code with verifyCookies, probably needs to be refactored
const extractCookieDetails = (req) => {
    const hpayloadCookie = req.cookies.hpayloadCookie;
    const signatureCookie = req.cookies.signatureCookie;
    if (!hpayloadCookie || !signatureCookie) {
        return undefined;
    }
    try {
        const decoded = verifyToken(hpayloadCookie, signatureCookie);
        return decoded; // Object containing userid and other values
    } catch (err) {
        console.err(`extractCookieDetails: Could not extract cookie details: `, err);
    }
}

const verifyCookies = (req, res, next) => {
    console.log(`SKIP_COOKIE_CHECK: ${process.env.SKIP_COOKIE_CHECK}`);
    if (process.env.SKIP_COOKIE_CHECK === 'true') {
        console.warn(`verifyCookies called: SKIPPING COOKIE CHECK`);
        next();
        return;
    }

    console.log(`verifyCookies called`);

    const hpayloadCookie = req.cookies.hpayloadCookie;
    const signatureCookie = req.cookies.signatureCookie;

    if (!hpayloadCookie || !signatureCookie) {
        console.error(`Cookies not found!`);
        const status = 401;
        const message = 'Unauthorized';
        res.status(status).json({ status, message });
    }

    try {
        // If the verify fails, it will throw an error
        const decoded = verifyToken(hpayloadCookie, signatureCookie);

        // console.log(JSON.stringify(decoded, undefined, 2));

        const userid = decoded.userid;
        const exp = new Date(decoded.exp * 1000).getTime();
        const now = new Date().getTime();
        // console.log(`exp:${decoded.exp} exp:${exp} expDate:${new Date(decoded.exp * 1000)} now:${now}`)
        if (exp <= now) {
            throw new Error ('Cookie is expired');
        }

        // const status = 200;
        // const message = 'Cookie authentication successful!';
        console.log(`Cookie authentication passed for user: ${userid}`);
        next();

        // findUserByUserid(userid, (err, user) => {
        //     if (err) {
        //         console.error(`Error when trying to find user by id: ${err}`);
        //         return res.status(500).send('Server error!');
        //     }
        //     if (!user) {
        //         console.error(`User not found on attempted login: ${userid}`);
        //         return res.status(404).send('User not found!');
        //     }
        //     res.status(status).json({ status, message });
        // });
    } catch (err) {
        const status = 401;
        const message = 'Unauthorized';
        console.error(`Cookie authentication was NOT successful! ${err}`);
        res.status(status).json({ status, message });
    }
}

router.get('/api/verify', verifyCookies, (req, res, next) => {
    // console.log(`here01`);
    const status = 200;
    const message = 'Cookie authentication successful!';
    console.log(message);
    res.status(status).json({ status, message });
});

// router.post('/api/refresh', (req, res) => {
//     const userid = req.body.userid;
//     const oldAccessToken = req.body.access_token;
//     const refreshToken = req.body.refresh_token;

//     // 1. check that access token is valid and expired

//     // 2. check that refresh token is valid

//     // 3. issue new access token
//     // const expiresIn = 24 * 60 * 60;
//     const accessToken = createAccessToken(user);
//     console.log(`New access token created for ${userid}`);
//     res.status(200).send({
//         "user": user, "access_token": accessToken
//     });
// });

// END AUTH API

module.exports = {
    router,
    verifyCookies,
    extractCookieDetails,
    verifyToken
};