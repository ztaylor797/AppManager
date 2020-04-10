const nodemailer = require("nodemailer");
const { config } = require('../helpers/jvmMethods.js');
const { dateDiffSecondsReadable } = require('../utils/dateUtils.js');
// const { extractCookieDetails } = require('../routes/auth.js');

const css = `<style> 
body {
    font-family: Calibri;
    padding : 0px;
    margin : 0px;
}

table {
    font-size: 12pt;
    /* border-top : black 1px solid;*/
    /* border-right : black 1px solid; */
    /* border-spacing : 10px */
    border-collapse : collapse;
}

td, th {
    border: 1px solid black;
    text-align : left;
    vertical-align : center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* border-left : black 1px solid; */
    /* border-bottom: black 1px solid; */
    padding : 4px;
}

th {
    /* This is a lighter shade of the current "primary" color in quasar.variables.sass (client) */
    background-color : #72b1ee;
}

td.number {
    color : blue
}

td.boolean {
    color : green;
    font-style : italic;
}

td.date {
    color : purple;
}

td.null:after {
    color : gray;
    font-style : italic;
    content : null;
}

td.array > table > tbody > tr > td {
    background-color: red;
}

.footer {
    font-size: 9pt;
}
</style>`;

const prepend = '<div class="container"><div class="inner">';
const append = '</div></div>';

async function sendEmail (from, to, subj, html) {
    let transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
    });

    const mailOpts = {
        from,
        to,
        subject: subj,
        html: css + prepend + html + append
    };

    // if (imagePath) {
    //     const cid = `graph_${new Date().getTime()}`;

    //     // Embed image at the bottom of the html body
    //     mailOpts.html += `<br><br><img src="cid:${cid}"/>`;

    //     mailOpts.attachments = [{
    //         filename: Path.basename(imagePath),
    //         path: imagePath,
    //         cid
    //     }]
    // }

    console.log(`Sending email! ${JSON.stringify(mailOpts, undefined, 2)}`);
    try {
        let info = await transporter.sendMail(mailOpts);
        console.log(`Message sent: ${JSON.stringify(info, undefined, 2)}`);
        return true;
    } catch (err) {
        console.error(`Error sending email: `, err);
        return false;
    }
}

// Returns boolean
const sendAdminNotification = async (subject, htmlBody) => {
    return await sendEmail(
        config.fromEmail,
        config.adminEmail,
        config.adminEmailSubjPrefix + subject,
        htmlBody
    );
}

// Returns boolean
const sendNotification = async (subject, successful, submittedAt, htmlBody, req) => {

    // Requiring here because we have a bit of a circular dependency between auth.js and email.js
    const { extractCookieDetails } = require('../routes/auth.js');
    const decoded = extractCookieDetails(req);
    const userid = decoded && decoded.userid ? decoded.userid : 'Unknown';
    const name = decoded && decoded.name ? decoded.name : 'Unknown';
    const email = decoded && decoded.email ? decoded.email : undefined;

    const to = [...config.notifyOnChangeDistros];
    if (email) {
        to.push(email);
    }

    const now = new Date();

    const topHtml = `<table>
<thead>
    <tr><th colspan="2">S4 Manager</th></tr>
</thead>
<tbody>
    <tr><th>Submitted by</th><td>${userid} - ${name}</td></tr>
    <tr><th>Submitted at</th><td>${submittedAt.convertDateToLogDate()} CST</td></tr>
    <tr><th>Completed at</th><td>${now.convertDateToLogDate()} CST</td></tr>
    <tr><th>Duration</th><td>${dateDiffSecondsReadable(submittedAt, now)}</td></tr>
    <tr><th>Successful</th><td><b><span style="color: ${successful ? 'green' : 'red'}">${successful ? 'YES' : 'NO'}</span></b></td></tr>
</tbody>
</table>
<br>`;

    const footerHtml = `<br><div class="footer">
<b>Notes:</b>
<ul>
    <li>We do not have support for showing the previous values at the moment, but this will likely be added later.</li>
    <li>The formatting of this email is temporary and will be improved at a later date.</li>
</ul>
</div>`

    return await sendEmail(
        config.fromEmail,
        to,
        config.emailSubjPrefix + subject + (successful ? '' : ' - FAILED!'),
        topHtml + htmlBody + footerHtml
    );
}

module.exports = {
    sendEmail,
    sendAdminNotification,
    sendNotification
}