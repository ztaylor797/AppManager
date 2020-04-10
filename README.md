# App Manager Server + Website

This website is designed for internal company use to manage multiple aspects of our development environment.
It is responsive and modern, using Quasar as the primary framework on top of Vue.js.

Here is a rough list of all the features it provides for us and our IT clients:

- List properties and current status of all QA Java JVMs
- View/Edit each JVM's database settings
- View outbound service status for all 3rd party endpoints used by the applications
- View/Edit outbound port settings
- Display EAR and JAR contents and checksums for all deployed apps in all JVMs
- Built-in wiki area for providing documentation to clients
- View/Edit batch email distribution lists
- View/Edit batch database settings
- Show current SharePlex configuration of databases
- Built-in PDF viewer for displaying network diagrams or otherwise
- View various other system details

The server is setup to run locally on port 8181, but most features won't work as they manipulate files directly on the VM where the web server is running.
Therefore it is recommended to run the node server.js directly from that VM. The frontend can be run locally with no problems.
The frontend in "production" state would be hosted from within the public directory of the server.

Clone repo:
```
$ git clone ssh://git@github.com/ztaylor797/appmanager.git
```

Install server and client deps (from project root directory):
```
If in bash/git bash
$ npm i && cd client && npm i && cd ../server && npm i

If in powershell (VSCode)
$ npm i; cd client; npm i; cd ../server; npm i;
```

Start dev server (from project root directory):
```
$ node server/server.js
```

Front-end work is done in the **client** directory and should not be committed or
hosted on your web server. To test changes on your front-end, run:
```
cd client
npm run serve
```
and view it on http://localhost:8182 

To publish to your web server, run:
```
cd client
npm run build
```
which will copy all static data (index.html, js, css, etc) to the server/public folder which you will host on the web server.

Basically, you need to take the contents of server/public that build generates and copy paste all of them into the server/public directory on the actual web server's directory.
