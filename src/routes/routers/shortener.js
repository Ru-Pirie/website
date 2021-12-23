const express = require('express');
const path = require('path');
const fs = require('fs');
const dateFormat = require('dateformat');

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

            if (!/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i.test(url)) return res.redirect(`/s?code=Invalid URL`)


            const urlExists = await this.client.db.query('SELECT * FROM shorteners WHERE destination = ?', [ url ])

            if (urlExists.length === 1) return res.redirect(`/s?code=${urlExists[0].url}`);

            while (!unique) {
                short = '';
                for (var i = 0; i < 6; i++) short += validChars.charAt(Math.floor(Math.random() * validChars.length));
                
                const result = await this.client.db.query('SELECT * FROM shorteners WHERE url = ?', [ short ])
                if (result.length === 0) unique = true;
            }

            await this.client.db.query('INSERT INTO shorteners (url, destination, clicks, created, lastClicked) VALUES (?, ?, 0, ?, ?)', [ short, url, Date.now(), Date.now() ]);
            
            res.redirect(`/s?code=${short}`)
        })

        this.router.all('/stats/:code', async (req, res) => {
            const code = req.params.code;

            const result = await this.client.db.query('SELECT * FROM shorteners WHERE url = ?', [ code ])
            
            if (result.length === 1) {
                let file = fs.readFileSync(path.join(__dirname, '../../data/html/url-short/stats.html')).toString()

                const created = new Date(result[0].created)
                const lastUsed = new Date(result[0].lastClicked)

                const newHTML = `
                <p><em>Shortened URL:</em> https://ru-pirie.com/s/${result[0].url}</p>
                <p><em>Destination URL:</em> ${result[0].destination}</p>
                <p><em>Times Clicked:</em> ${result[0].clicks}</p>
                <p><em>Created At:</em> ${dateFormat(created, "dddd, mmmm dS, yyyy, h:MM:ss TT")} (${result[0].created})</p>
                <p><em>Last Used:</em> ${dateFormat(lastUsed, "dddd, mmmm dS, yyyy, h:MM:ss TT")} (${result[0].lastClicked})</p>
                `

                file = file.replace('{{INNER_HTML}}', newHTML)
                res.end(file)
            } else {
                res.redirect('/s?code=Shortened URL does not exist!');
            }
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

                const created = new Date(result[0].created)
                const lastUsed = new Date(result[0].lastClicked)

                const newHTML = `
                <p><em>Shortened URL:</em> https://ru-pirie.com/s/${result[0].url}</p>
                <p><em>Destination URL:</em> ${result[0].destination}</p>
                <p><em>Times Clicked:</em> ${result[0].clicks}</p>
                <p><em>Created At:</em> ${dateFormat(created, "dddd, mmmm dS, yyyy, h:MM:ss TT")} (${result[0].created})</p>
                <p><em>Last Used:</em> ${dateFormat(lastUsed, "dddd, mmmm dS, yyyy, h:MM:ss TT")} (${result[0].lastClicked})</p>
                `

                file = file.replace('{{INNER_HTML}}', newHTML)
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