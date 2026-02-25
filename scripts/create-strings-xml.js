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
    console.log('*** Updating cdv_strings.xml with Arabic app name ***');
    
    var projectRoot = context.opts.projectRoot;
    const usesNewStructure = fs.existsSync(path.join(projectRoot, 'platforms', 'android', 'app'));
    const basePath = usesNewStructure ? path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main') : path.join(projectRoot, 'platforms', 'android');
    
    var configPath = path.join(basePath, 'res', 'xml', 'config.xml');
    var cdvStringsPath = path.join(basePath, 'res', 'values', 'cdv_strings.xml');  // Changed to cdv_strings.xml
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
    
    // Check if cdv_strings.xml exists
    if (!fs.existsSync(cdvStringsPath)) {
        console.log('cdv_strings.xml not found yet, skipping');
        return;
    }
    
    // Read and modify cdv_strings.xml
    try {
        var cdvStringsXml = fs.readFileSync(cdvStringsPath, 'UTF-8');
        
        parser.parseString(cdvStringsXml, function (err, data) {
            if (err) {
                console.error('Error parsing cdv_strings.xml:', err.message);
                return;
            }
            
            if (!data || !data.resources || !data.resources.string) {
                console.error('Invalid cdv_strings.xml structure');
                return;
            }
            
            // Update app_name
            data.resources.string.forEach(function (string) {
                if (string.$.name === 'app_name') {
                    console.log('*** Updating app_name from "' + string._ + '" to "' + name + '"');
                    string._ = name;
                }
            });
            
            // Write back
            fs.writeFileSync(cdvStringsPath, builder.buildObject(data));
            console.log('*** Successfully updated cdv_strings.xml with Arabic name');
        });
    } catch(e) {
        console.error('*** Error updating cdv_strings.xml:', e.message);
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
