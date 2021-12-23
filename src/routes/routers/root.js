const express = require('express');
const Walker = require('../../util/walk')
const path = require('path');
const nodemailer = require('nodemailer')

class Router {
    constructor(client) {
        this.name = 'root';
        this.path = '/';
        this.dirPath = path.join(__dirname, '../../data/html/root')
        this.client = client;
        this.enabled = true;
        this.router = express.Router();
    }

    async setupRoutes() {
        const files = await Walker.walk(this.dirPath);

        files.files.forEach(async file => {
            const routePath = file.exact.split(this.name)[1].replace(/\\/gi, '/').split('.')[0]
            if (file.name === 'index.html') {
                this.router.all(routePath.split('index')[0], (req, res) => {
                    return res.sendFile(file.exact)
                })
            } else if (!file.name.startsWith('special_')) {
                this.router.all(routePath, (req, res) => {
                    return res.sendFile(file.exact)
                })
            } else if (file.name.startsWith('special_')){
                // deal with special case 
                this.router.all(routePath.replace('special_', ''), (req, res) => {
                    return res.send('Special Condition file')
                })
            }
        })

        this.router.post('/contact/email', async (req, res) => {
            const body = req.body

            const mailOptions = {
                from: body.email,
                to : 'rubens.pirie@gmail.com',
                subject : `Web Contact Form (${body.name})`,
                text: body.content,
            };

            const smtpTransport = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await smtpTransport.sendMail(mailOptions, (err) => {
                if (err) {
                    this.client.log.error(`Email ${err}`)
                    return res.redirect(`/contact?message=error`)
                } else {
                    return res.redirect(`/contact?message=success`)
                }
            })
        })
    }

    getRouter = () => this;

}

module.exports = Router;