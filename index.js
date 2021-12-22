require('dotenv').config();

const express = require('express')
const app = express();

const fs = require('fs');
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

const Logger = require('./src/util/logger');
const Database = require('./src/util/database');
const Walker = require('./src/util/walk');

const log = new Logger();

app.use(express.urlencoded());

client = { 
    createdAt: Date.now(), 
    log,
};

client.log.info(`Client has been created (${client.createdAt}). Running main...`)

app.all('*', async (req, res, next) => { 
    const IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress.split(':')[3]
    const CONN = req.headers.connection
    const DEVICE = require('./src/util/device')(client, req.headers['user-agent'])

    if (req.originalUrl !== '/favicon.ico' && !req.originalUrl.startsWith('/static')) {
        
        client.log.web(`[${req.method.toUpperCase()}] ${IP}@${DEVICE.vendor}. Accessed '${req.originalUrl}' using ${DEVICE.primaryPlatform} (${DEVICE.type})`)
        client.db.query('INSERT INTO accessLogs (accessTime, address, ip, connection, type, platform, vendor, device, rawAgent, rawDevice) VALUES (?,?,?,?,?,?,?,?,?,?)', [
            Date.now(),
            req.originalUrl,
            IP,
            CONN,
            DEVICE.type ? DEVICE.type : 'bot',
            DEVICE.primaryPlatform,
            DEVICE.vendor,
            DEVICE.device,
            DEVICE._raw,
            JSON.stringify(DEVICE)
        ]);
    }

    if (req.originalUrl.split('.')[1]) {
        const statics = await Walker.walk('./src/routes/static')
        let foundFile = undefined;
        statics.files.forEach(file => { 
            if (file.exact.replace(/(\\)/gi, '/').split('/routes')[1] === req.originalUrl) {
                foundFile = file.exact        
            } 
        })

        if (foundFile) return res.sendFile(foundFile);
        else if (req.originalUrl.startsWith('/static/')){
            client.log.warn(`User tried to access a nonexistant static file. '${req.originalUrl}'`)
            res.send('Resource not found: ' + req.originalUrl)
        }
    } else {
        next();
    }
})

async function main() {
    const db = new Database(client);
    await db.initialize();
    const files = await Walker.walk('./src/routes/routers')

    files.files.forEach(async file => {
        const Router = require(file.exact)
        const router = new Router(client);

        await router.setupRoutes();

        app.use(router.path, router.router)
        client.log.web(`${router.name} has been routed to ${router.path}`)
    })

    client.log.info('Database created and synced')
    client.db = db;
}

main();

if (process.env.NODE_ENV === 'prod') {
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/ru-pirie.com/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/ru-pirie.com/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/ru-pirie.com/chain.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca,
    };

    http.createServer(app).listen(80)
    http.createServer(credentials, app).listen(443)
    this.client.log.web('Listening on http and https')
}  else {
    http.createServer(app).listen(PORT)
    this.client.log.web('Listening on http only')
}



module.exports = client