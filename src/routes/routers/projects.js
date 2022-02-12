const express = require('express');
const Walker = require('../../util/walk')
const path = require('path');

class Router {
    constructor(client) {
        this.name = 'projects';
        this.path = '/projects';
        this.dirPath = path.join(__dirname, '../../data/html/projects')
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
                    res.sendFile(file.exact)
                })
            } else if (!file.name.startsWith('special_')) {
                this.router.all(routePath, (req, res) => {
                    res.sendFile(file.exact)
                })
            } else if (file.name.startsWith('special_')){
                // deal with special case 
            }
        })
    }

    getRouter = () => this;

}

module.exports = Router;