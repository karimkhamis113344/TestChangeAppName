#!/usr/bin/env node
var fs = require('fs');
var path = require("path");
var xml2js = require('xml2js');
var semver = require('semver');
var builder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'UTF-8'
    }
});

module.exports = function (context) {
    if(context.opts.platforms.indexOf('android') === -1) return;
    console.log('*** Pre-creating strings.xml with Arabic app name ***');
    
    var projectRoot = context.opts.projectRoot;
    const usesNewStructure = fs.existsSync(path.join(projectRoot, 'platforms', 'android', 'app'));
    const basePath = usesNewStructure ? path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main') : path.join(projectRoot, 'platforms', 'android');
    
    var configPath = path.join(basePath, 'res', 'xml', 'config.xml');
    var stringsPath = path.join(basePath, 'res', 'values', 'strings.xml');
    var name;
    
    // Get the app name from config
    try {
        fs.accessSync(configPath, fs.F_OK);
        name = getConfigParser(context, configPath).getPreference('AppName');
        console.log('*** App name to set:', name);
    } catch(e) {
        console.log('Could not read config, skipping');
        return;
    }
    
    if (!name) {
        console.log('No AppName preference found, skipping');
        return;
    }
    
    // Create strings.xml
    const stringsXmlContent = {
        resources: {
            string: [
                {
                    $: { name: 'app_name' },
                    _: name
                },
                {
                    $: { name: 'launcher_name' },
                    _: '@string/app_name'
                },
                {
                    $: { name: 'activity_name' },
                    _: '@string/launcher_name'
                }
            ]
        }
    };
    
    try {
        // Make sure the directory exists
        const valuesDir = path.dirname(stringsPath);
        if (!fs.existsSync(valuesDir)) {
            fs.mkdirSync(valuesDir, { recursive: true });
            console.log('*** Created values directory');
        }
        
        fs.writeFileSync(stringsPath, builder.buildObject(stringsXmlContent));
        console.log('*** Successfully created strings.xml at:', stringsPath);
        console.log('*** With app name:', name);
    } catch(e) {
        console.error('*** Error creating strings.xml:', e.message);
    }
};

function getConfigParser(context, config) {
    if (semver.lt(context.opts.cordova.version, '5.4.0')) {
        ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser');
    } else {
        ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
    }
    return new ConfigParser(config);
}
