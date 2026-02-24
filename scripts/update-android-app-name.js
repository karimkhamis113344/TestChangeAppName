#!/usr/bin/env node
var fs = require('fs');
var path = require("path");
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var semver = require('semver');
var builder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'UTF-8'
    }
});

module.exports = function (context) {
    if(context.opts.platforms.indexOf('android') === -1) return;
    console.log('Attempting to set app name for android');
    
    var projectRoot = context.opts.projectRoot;
    const usesNewStructure = fs.existsSync(path.join(projectRoot, 'platforms', 'android', 'app'));
    const basePath = usesNewStructure ? path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main') : path.join(projectRoot, 'platforms', 'android');
    
    var configPath = path.join(basePath, 'res', 'xml', 'config.xml');
    var stringsPath = path.join(basePath, 'res', 'values', 'strings.xml');
    var stringsXml, name;

    // make sure the android config file exists
    try {
        fs.accessSync(configPath, fs.F_OK);
    } catch(e) {
        console.error(`Could not find android config.xml at ${configPath}`);
        return;
    }

    name = getConfigParser(context, configPath).getPreference('AppName');
    
    if (name) {
        // Add error handling for reading strings.xml
        try {
            stringsXml = fs.readFileSync(stringsPath, 'UTF-8');
        } catch(e) {
            console.error(`Could not read strings.xml at ${stringsPath}:`, e.message);
            // Exit gracefully with numeric code instead of string
            process.exitCode = 1;
            return;
        }
        
        parser.parseString(stringsXml, function (err, data) {
            if (err) {
                console.error('Error parsing strings.xml:', err.message);
                process.exitCode = 1;
                return;
            }
            
            // Add safety check for data structure
            if (!data || !data.resources || !data.resources.string) {
                console.error('Invalid strings.xml structure');
                process.exitCode = 1;
                return;
            }
            
            data.resources.string.forEach(function (string) {
                if (string.$.name === 'app_name') {
                    console.log('Setting App Name: ', name);
                    string._ = name;
                }
            });
            
            try {
                fs.writeFileSync(stringsPath, builder.buildObject(data));
                console.log('Successfully updated app name');
            } catch(e) {
                console.error('Error writing strings.xml:', e.message);
                process.exitCode = 1;
            }
        });
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
