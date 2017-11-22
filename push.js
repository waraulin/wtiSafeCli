#!/usr/bin/env node
//Authored by Will Raulin 11/22/17

var properties = require ("properties");
var fs = require('fs');
var prompt = require('prompt-sync')({autocomplete: false});
var request = require('request');

var localProperties = null;
var config = { privateKey: null, projectId: null, locale: null, localPropertiesPath: null, wtiBaseUrl: null };

function init() {
	console.log("Safe-pushing to wti.");

	fs.readFile(__dirname + "/wti-safe-config.properties", "utf8", function(err, data) {
		console.log("Reading config.");
		if(err) {
			console.log(err);
		} else {
			//Parse string into an Object and update
			config = properties.parse(data);
			loadLocalProperties();
		}
	});
}

function loadLocalProperties() {
	console.log("Loading local properties.");
	fs.readFile(config.localPropertiesPath, 'utf8', (err,data) => {
		if(err) {
			console.log(err);
		} else {
			//Parse string response into an Object and update
			localProperties = properties.parse(data);
			verifyResolvedConflicts(localProperties);
		}
	});
}

function verifyResolvedConflicts(localProperties) {
	console.log("Checking for unresolved conflicts.");
	var invalidKeys = [];
	for(i in localProperties) {
		//Checking keys first
		if(i.indexOf("+++++++ADDED") >= 0 || i.indexOf("-------REMOVED") >= 0 || i.indexOf("~~~~~~~CHANGED") >= 0 || i.indexOf("pulled_from_remote") >= 0 || i.indexOf("currently_on_local") >= 0) {
			invalidKeys.push(i);
		}
	}

	if(invalidKeys.length <= 0) {
		console.log("No unresolved conflicts detected. Pushing to WTI.");
		wtiSafePush(localProperties);
	} else {
		showSegments = prompt(invalidKeys.length + ' invalid segments have been detected. Your file has not been pushed. Would you like to view them? (y/n) ');
		if(showSegments == 'y' || showSegments == 'yes') {
			console.log(invalidKeys);
		}
	}
}

function wtiSafePush(localProperties) {
	localProperties = properties.stringify(localProperties);

	var req = request.put(config.wtiBaseUrl + config.privateKey + "/files/" + config.projectId + "/locales/" + config.locale, function(err, response, body) {
	    if(err) {
	    	console.log(err);
	    } else {
	    	if(response.statusCode === 202) {
	    		console.log("Your push was successful.");
	    	} else {
	    		console.log("Status: " + response.statusCode);
	    	}
	    }
	});
	var form = req.form();
	form.append('file', localProperties, {
		filename: 'messages_test.properties',
		contentType: 'text/plain'
	});
}

init();
