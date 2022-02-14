const express = require('express');
const Walker = require('../../util/walk')
const path = require('path');
const fs = require('fs');

class Router {
    constructor(client) {
        this.name = 'admin';
        this.path = '/admin';
        this.dirPath = path.join(__dirname, '../../data/html/admin')
        this.client = client;
        this.enabled = true;
        this.router = express.Router();
    }

    async setupRoutes() {
        const files = await Walker.walk(this.dirPath);

        files.files.forEach(async file => {
            const routePath = file.exact.split(this.name)[1].replace(/\\/gi, '/').split('.')[0]
            if (file.name === 'index.html') {
                this.router.get(routePath.split('index')[0], (req, res) => {
                    return res.sendFile(file.exact)
                })
            } else if (!file.name.startsWith('special_')) {
                this.router.get(routePath, (req, res) => {
                    if (req.query.user && req.query.pass) {
                        if (req.query.user === process.env.SECURE_1 && req.query.pass === process.env.SECURE_2) {
                            return res.sendFile(file.exact)
                        } else {
                            return res.redirect('/')
                        }
                    } else {
                        return res.redirect('/')
                    }
                })
            } else if (file.name.startsWith('special_')){
                // deal with special case 
            }
        })

        this.router.post('/database', async (req, res) => {
            if (req.query.user && req.query.pass) {
                if (req.query.user === process.env.SECURE_1 && req.query.pass === process.env.SECURE_2) {
                    const result = await client.db.query(req.body.query)
                    if (result) { 
                        res.end(fs.readFileSync(this.dirPath + '/special_database.html', 'utf8').replace('{{RESPONSE}}', JSON.stringify(result, null, '\t')).replace('{{QUERY}}', req.body.query));
                    } else {
                        res.end(fs.readFileSync(this.dirPath + '/special_database.html', 'utf8').replace('{{RESPONSE}}', 'Err: Check your query dumbass').replace('{{QUERY}}', req.body.query));
                    }
                } else {
                    return res.redirect('/')
                }
            } else {
                return res.redirect('/')
            }
        })

        this.router.post('/createShort', async (req, res) => {
            if (req.query.user && req.query.pass) {
                if (req.query.user === process.env.SECURE_1 && req.query.pass === process.env.SECURE_2) {
                    client.db.query('INSERT INTO SHORTS (url, destination, clicks) VALUES (?, ?, 0)', [req.body.shortended, req.body.url])
                    return res.end(fs.readFileSync(this.dirPath + '/special_shorten.html', 'utf8').replace('{{URL}}', 'https://ru-pirie.com/s/' + req.body.shortended));
                } else {
                    return res.redirect('/')
                }
            } else {
                return res.redirect('/')
            }
        })
    }

    getRouter = () => this;    
}

module.exports = Router;