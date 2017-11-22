#!/usr/bin/env node
//Authored by Will Raulin 11/22/17

var properties = require("properties");
var fs = require('fs');
var request = require('request');

var remoteProperties = null;
var localProperties = null;
var config = { privateKey: null, projectId: null, locale: null, localPropertiesPath: null, wtiBaseUrl: null };

function init() {
	console.log("Safe-pulling from wti.");

	fs.readFile(__dirname + "/wti-safe-config.properties", "utf8", function(err, data) {
		console.log("Reading config.");
		if(err) {
			console.log(err);
		} else {
			//Parse string into an Object and update
			config = properties.parse(data);
			pullRemoteProperties();
		}
	});
}

function pullRemoteProperties() {
	console.log("Loading remote properties.");

	request.get(config.wtiBaseUrl + config.privateKey + "/files/" + config.projectId + "/locales/" + config.locale, function (err, response) {
	    if(err) {
	    	console.log(err);
	    } else {
		    remoteProperties = properties.parse(response.body);
		    loadLocalProperties();
	    }
	});
}

//TODO@WR - Allow comments in properties file to persist.
function loadLocalProperties() {
	console.log("Loading local properties.");

	fs.readFile(config.localPropertiesPath, 'utf8', function (err, data) {
		if(err) {
			console.log(err);
		} else {
			//Parse string response into an Object and update
			localProperties = properties.parse(data);

			var proceedDiff = true;
			//Make sure old local properties file doesn't contain artifacts from previous pull
			for(i in localProperties) {
				if(i.indexOf("+++++++ADDED_from_remote--") >= 0 || i.indexOf("-------Removed_from_local--") >= 0 || i.indexOf("~~~~~~~CHANGED_pulled_from_remote--") >= 0) {
					proceedDiff = false;
				}
			}

			if(proceedDiff) {
				calcDiff(remoteProperties, localProperties);
			} else {
				console.log("Please resolve your previous pull or reset your local properties file before pulling again.");
			}
		}
	});
}

function calcDiff(remoteProperties, localProperties) {
	console.log("Calculating diff");

	if(remoteProperties && localProperties) {
		var diff = {};
		var store = [];
		var added = [];
		var removed = [];

		//Combine both local and remote properties into one store
		for (i in remoteProperties) {
			store.push(i);
		}
		for (j in localProperties) {
			if(store[j] === undefined) {
				store.push(j);
			}
		}

		//Loop over all keynames
		for (x in store) {
			var key = store[x];

			//Check store for matching keynames with changed values and push to diff object
			if(remoteProperties.hasOwnProperty(key) && localProperties.hasOwnProperty(key) && remoteProperties[key] !== localProperties[key]) {
				diff[key] = {remote: remoteProperties[key], local: localProperties[key]};
			}

			//Push removed and added keynames to arrays

			if(! remoteProperties.hasOwnProperty(key)) {
				//If remote does not have a keyname that is present in local
				/*removed.push(key);*/
			} else if (! localProperties.hasOwnProperty(key)) {
				//If local does not have a keyname that is present in remote
				added.push(key);
			}
		}

		printDiff(remoteProperties, localProperties, added, removed, diff);
	}
}

function printDiff(remoteProperties, localProperties, added, removed, diff) {
	console.log("Annotating properties file.");

	//Append all added segments to end of properties file
	for (x in added) {
		//Display added segments
		oldKey = added[x];
		key = "+++++++ADDED_from_remote--" + oldKey;
		localProperties[key] = remoteProperties[oldKey];
		delete localProperties[oldKey];
	}	

	//Append all removed segments to end of properties file
	for (y in removed) {
		//Show keynames in local
		oldKey = removed[y];	
		key = "-------Removed_from_local--" + oldKey;
		localProperties[key] = localProperties[oldKey];
		delete localProperties[oldKey];
	}

	//Append changed segments to end of properties file
	for (i in localProperties) {
		if(diff.hasOwnProperty(i)) {
			keyRemote = "~~~~~~~CHANGED_pulled_from_remote--" + i;
			keyLocal = "~~~~~~~CHANGED_currently_on_local--" + i;
			localProperties[keyRemote] = diff[i].remote;
			localProperties[keyLocal] = diff[i].local;
			delete localProperties[i];
		}
	}

	var stringified = properties.stringify(localProperties);

	fs.writeFile(config.localPropertiesPath, stringified, function(err) {
		if(err) {
			return console.log(err);
		}

		console.log("The file was saved to " + config.localPropertiesPath);
	});
}

init();
