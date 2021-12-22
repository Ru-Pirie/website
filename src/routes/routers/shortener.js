const express = require('express');
const path = require('path');

class Router {
    constructor(client) {
        this.name = 'url-shortener';
        this.path = '/s';
        this.client = client;
        this.enabled = true;
        this.router = express.Router();
    }

    async setupRoutes() {
        this.router.post('/create', async (req, res) => {
            const url = req.body.url;
            const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let unique = false;
            let short = '';

            if (!/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(url)) return res.redirect(`/s?code=Invalid URL`)

            while (!unique) {
                short = '';
                for (var i = 0; i < 5; i++) short += validChars.charAt(Math.floor(Math.random() * validChars.length));
                
                const result = await this.client.db.query('SELECT * FROM shorteners WHERE url = ?', [ short ])
                if (result.length === 0) unique = true;
            }

            await this.client.db.query('INSERT INTO shorteners (url, destination, clicks, created, lastClicked) VALUES (?, ?, 0, ?, ?)', [ short, url, Date.now(), Date.now() ]);
            
            res.redirect(`/s?code=${short}`)
        })

        this.router.all('/:code', async (req, res) => {
            const code = req.params.code;

            const result = await this.client.db.query('SELECT * FROM shorteners WHERE url = ?', [ code ])
            
            if (result.length === 1) {
                this.client.db.query('UPDATE shorteners SET clicks = ?, lastClicked = ? WHERE url = ? ', [ result[0].clicks + 1, Date.now(), result[0].url ])
                return res.redirect(302, result[0].destination);
            } else {
                res.redirect('/s?code=Shortened URL does not exist!');
            }

            // if (/^([A-z]|[1-9]){6}$/.test(code)) {
            //     res.end(code);
            // } 
        })

        this.router.all('/', async (req, res) => {
            res.sendFile(path.join(__dirname, '../../data/html/url-short/index.html'))
        })
    }

    getRouter = () => this;

}

module.exports = Router;