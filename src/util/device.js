module.exports = (client, agent) => {
    const parsed = {}

    try {
        const PRE = agent.split(' (KHTML')[0].trim();
        const POST = agent.split(' (KHTML')[1].split(')')[1].trim();

        const systemDetials = PRE.split(';')
    
        systemDetials[systemDetials.length - 1] = systemDetials[systemDetials.length - 1].split(') ')[0]
        systemDetials[0] = systemDetials[0].split(' (')[1]
    
        systemDetials.forEach(systemDetial => systemDetials[systemDetials.indexOf(systemDetial)] = systemDetial.trim())
    
        parsed._raw = agent
        parsed._pre = PRE;
        parsed._post = POST;

        parsed.isPhone = /(mobile)|(iphone)|(ipad)/gi.test(agent) ? true : false
        parsed.isDesktop = /(windows)|(macintosh)/gi.test(agent) ? true : false
        parsed.isOther = parsed.isPhone || parsed.isDesktop ? false : true

        // todo identity 
        parsed.type = parsed.isPhone ? 'phone' : parsed.isDesktop ? 'desktop' : 'other'

        parsed.primaryPlatform = systemDetials.shift();
        parsed.device = systemDetials.pop();
        
        if (/(mac)|(iphone)/gi.test(PRE)) parsed.vendor = 'Apple';
        else if (/(android)/gi.test(PRE)) parsed.vendor = 'Android';
        else if (/(linux)/gi.test(PRE)) parsed.vendor = 'Linux (Generic)';
        else if (/(windows)/gi.test(PRE)) parsed.vendor = 'Microsoft';

        parsed.otherPlatforms = systemDetials;
        parsed.details = []
        POST.split(' ').forEach(detail => { parsed.details.push({ name: detail.split('/')[0], version: detail.split('/')[1] })})
    }
    catch (e){
        client.log.warn(`NON-STANDARD DEVICE DETECTED ${agent ? agent.split(' ')[0] : ''} (FULL: ${agent})`)
        client.log.error(e.message)
        return agent ? agent.split(' ')[0] : 'None';
    }
    

    return parsed
}