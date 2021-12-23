const express = require('express');
const path = require('path');
const fs = require('fs');

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
        })

        this.router.all('/:code/stats', async (req, res) => {
            const code = req.params.code;

            const result = await this.client.db.query('SELECT * FROM shorteners WHERE url = ?', [ code ])
            
            if (result.length === 1) {
                let file = fs.readFileSync(path.join(__dirname, '../../data/html/url-short/stats.html')).toString()


                const unix_timestamp = result[0].created
                const date = new Date(unix_timestamp);
                const hours = date.getHours();
                const minutes = "0" + date.getMinutes();
                const seconds = "0" + date.getSeconds();
                
                // Will display time in 10:30:23 format
                const formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                
                console.log(formattedTime);

                const newHTML = `
                <p><em>Shortened URL:</em> https://ru-pirie.com/s/${result[0].url}</p>
                <p><em>Destination URL:</em> ${result[0].destination}</p>
                <p><em>Times Clicked:</em> ${result[0].clicks}</p>
                <p><em>Created At:</em> ${result[0].created}</p>
                <p><em>Last Used:</em> ${result[0].lastClicked}</p>
                `

                file = file.replace('{{INNER_HTML}}', newHTML)

                console.log(file)
                res.end(file)
            } else {
                res.redirect('/s?code=Shortened URL does not exist!');
            }
        })

        this.router.all('/', async (req, res) => {
            res.sendFile(path.join(__dirname, '../../data/html/url-short/index.html'))
        })
    }

    getRouter = () => this;

}

module.exports = Router;