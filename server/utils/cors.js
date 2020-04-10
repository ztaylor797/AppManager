const cors = require('cors');

function appInitCors(app, allowedOrigins) {
    app.use(cors({
        exposedHeaders: 'Authorization, access-control-allow-origin, Origin, X-Requested-With, Content-Type, Accept, X-PINGOTHER',
        credentials: true,
        origin: function(origin, callback){
            console.log(`Origin: ${origin}`);
            // allow requests with no origin 
            // (like mobile apps or curl requests)
            if(!origin) return callback(null, true);
            if(allowedOrigins.indexOf(origin) === -1){
                var msg = 'The CORS policy for this site does not ' +
                            'allow access from the specified Origin.';
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        }
    }));

    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Headers', 'Authorization, access-control-allow-origin, Origin, X-Requested-With, Content-Type, Accept, X-PINGOTHER');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
        next();
    });
}

module.exports = {
    appInitCors
}