var express = require('express');
var fs = require('fs');
var request = require('request');
var http = require('http-request');

var app = express();
var port = process.env.PORT || 3000;

var noaaPoleTime = 60000;
var solarWindMagData;
var solarWindPlasmaData;
var wingKpData;
var wingKpTxt = 'data/txt/wing-kp.txt';

var noaaPoling = setInterval(function(){

	request('http://services.swpc.noaa.gov/experimental/products/solar-wind/mag-5-minute.json', function (error, response, body) {

		if (!error && response.statusCode == 200) {
			console.log(body); // Show the HTML
			solarWindMagData = body;
		}
		else {
			console.log(error);
			solarWindMagData = error;
		}
	});

	request('http://services.swpc.noaa.gov/experimental/products/solar-wind/plasma-5-minute.json', function (error, response, body) {

		if (!error && response.statusCode == 200) {
			console.log(body); // Show the HTML
			solarWindPlasmaData = body;
		}
		else {
			console.log(error);
			solarWindPlasmaData = error;
		}
	});

	http.get({

		url: 'http://services.swpc.noaa.gov/text/wing-kp.txt',
			progress: function (current, total) {
				console.log('downloaded %d bytes from %d', current, total);
			}
		},
		wingKpTxt, function (err, res) {

			if (err) {
				console.error(err);
				return;
			}

			// files are always small, so we'll just take the lot
			fs.readFile(wingKpTxt, {
					encoding: 'UTF-8'
			},

			function (err, file) {

				if (err) throw err;
				var fileArr = file.toString().split(/\r?\n/);
				var jsonOut = fs.createWriteStream('data/json/wing-kp.json');
				var outData = [];

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

}, noaaPoleTime);

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

app.get('/solar-wind/mag', function(req, res){
	res.send(solarWindMagData);
});

app.get('/solar-wind/plasma', function(req, res){
	res.send(solarWindPlasmaData);
});

// TODO this to handle generic rest reqs
app.get('/solar-wind/wing-kp', function(req, res){

	var fileName = __dirname +"/data/json/wing-kp.json";
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