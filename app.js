var express = require('express');
var fs = require('fs');
var request = require('request');
var httpRequest = require('http-request');

var app = express();
var port = process.env.PORT || 7000;

// LOAD SERVICE CONFIG
var config = require('./config.json');

// EXPERIMENTAL SERVICES STILL A BIT FLAKEY..
var magExpPolling = setInterval(function(){

	var service = config.jsonEndpoints.mag;
	console.log("requesting "+ service.url);

	request.get(service.url, function (error, response, body) {

		if (!error && response.statusCode == 200) {

			console.log("got: "+service.name);
			console.log(body);

			var jsonOut = fs.createWriteStream('data/json/'+ service.name +'.json');

			jsonOut.write(body);
			jsonOut.on('error', function(err) {
				console.log("JSON WRITE ERR");
				fs.createWriteStream('error.txt').write(error).end();
				console.log(err);
			});
			jsonOut.end();
		}
		else {
			console.log("REQUEST ERR");
			console.log(error);
		}
	});

}, config.pollingIntervals.NOAA);

var plasmaExpPolling = setInterval(function(){

	var service = config.jsonEndpoints.plasma;
	console.log("requesting "+ service.url);

	request.get(service.url, function (error, response, body) {

		if (!error && response.statusCode == 200) {

			console.log("got: "+service.name);
			console.log(body);

			var jsonOut = fs.createWriteStream('data/json/'+ service.name +'.json');

			jsonOut.write(body);
			jsonOut.on('error', function(err) {
				console.log("JSON WRITE ERR");
				fs.createWriteStream('error.txt').write(error).end();
				console.log(err);
			});
			jsonOut.end();
		}
		else {
			console.log("REQUEST ERR");
			console.log(error);
		}
	});

}, config.pollingIntervals.NOAA);

var kpPolling = setInterval(function(){

	var service = config.txtEndpoints.wingKp;
	httpRequest.get({
		url: service.url,
		progress: function (current, total) {
			console.log('downloaded %d bytes from %d', current, total);
		}
	},
	'data/txt/' + service.name + service.extension, function (err, res) {

		if (err) {
			console.error(err);
			return;
		}

		// these logs are always going to be small, so we'll just wop the lot
		fs.readFile('data/txt/' + service.name + service.extension, {
				encoding: 'UTF-8'
			},
			function (err, file) {

				if (err) throw err;
				var fileArr = file.toString().split(/\r?\n/);
				var jsonOut = fs.createWriteStream('data/json/' + service.name + '.json');
				var outData = [service.headers];

				for(var i = 0; i < fileArr.length; i++){

					// strip head and split into array
					var lineOut = parseLineTxt(fileArr[i]);
					if(lineOut && lineOut.length > 1){
						outData.push(lineOut);
					}
				}
				jsonOut.write(JSON.stringify(outData));
				jsonOut.on('error', function(err) { console.log(err); });
				jsonOut.end();
				console.log("done!");
			});

	});

}, config.pollingIntervals.NOAA);

var magPolling = setInterval(function(){

	var service = config.txtEndpoints.aceMag;
	httpRequest.get({
		url: service.url,
		progress: function (current, total) {
			console.log('downloaded %d bytes from %d', current, total);
		}
	},
		'data/txt/' + service.name + service.extension, function (err, res) {

			if (err) {
				console.error(err);
				return;
			}

			// these logs are always going to be small, so we'll just wop the lot
			fs.readFile('data/txt/' + service.name + service.extension, {
					encoding: 'UTF-8'
				},
				function (err, file) {

					if (err) throw err;
					var fileArr = file.toString().split(/\r?\n/);
					var jsonOut = fs.createWriteStream('data/json/' + service.name + '.json');
					var outData = [service.headers];

					for(var i = 0; i < fileArr.length; i++){

						// strip head and split into array
						var lineOut = parseLineTxt(fileArr[i]);
						if(lineOut && lineOut.length > 1){
							outData.push(lineOut);
						}
					}
					jsonOut.write(JSON.stringify(outData));
					jsonOut.on('error', function(err) { console.log(err); });
					jsonOut.end();
					console.log("done!");
				});

		});

}, config.pollingIntervals.NOAA);

var swepamPolling = setInterval(function(){

	var service = config.txtEndpoints.aceSwepam;
	httpRequest.get({
		url: service.url,
		progress: function (current, total) {
			console.log('downloaded %d bytes from %d', current, total);
		}
	},
		'data/txt/' + service.name + service.extension, function (err, res) {

			if (err) {
				console.error(err);
				return;
			}

			// these logs are always going to be small, so we'll just wop the lot
			fs.readFile('data/txt/' + service.name + service.extension, {
					encoding: 'UTF-8'
				},
				function (err, file) {

					if (err) throw err;
					var fileArr = file.toString().split(/\r?\n/);
					var jsonOut = fs.createWriteStream('data/json/' + service.name + '.json');
					var outData = [service.headers];

					for(var i = 0; i < fileArr.length; i++){

						// strip head and split into array
						var lineOut = parseLineTxt(fileArr[i]);
						if(lineOut && lineOut.length > 1){
							outData.push(lineOut);
						}
					}
					jsonOut.write(JSON.stringify(outData));
					jsonOut.on('error', function(err) { console.log(err); });
					jsonOut.end();
					console.log("done!");
				});

		});

}, config.pollingIntervals.NOAA);

function parseLineTxt(line){

	if(line.substr(0, 1) != '#' && line.substr(0, 1) != ':'){

		var lineOut = [];
		// split into cells and clean
		var lineArr = line.split(" ");
		for(var i = 0; i < lineArr.length; i++){

			var cleanString = lineArr[i].replace(/\s+/g, ',');
			if(cleanString){
				lineOut.push(cleanString);
			}
		}
		return lineOut;
	}
}

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.all('/*', function(req, res){

	var fileName = __dirname +"/data/json"+ req.url +".json";
	res.setHeader('Content-Type', 'application/json');
	res.sendFile(fileName, {}, function (err) {
		if (err) {
			console.log(err);
			res.send({"err": "Meaningful err system coming soon..."});
		}
	});
});

app.listen(port, function(){
	console.log("app running on "+port);
});