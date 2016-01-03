var express = require('express');
var fs = require('fs');
var request = require('request');
var http = require('http-request');

var app = express();
var port = process.env.PORT || 3000;

// LOAD SERVICE CONFIG
var config = require('./config.json');


var noaaPoling = setInterval(function(){

	// JSON POLLING
	for(var i = 0; i < config.jsonEndpoints.length; i++){

		var service = config.jsonEndpoints[i];

		request(service.url, function (error, response, body) {

			if (!error && response.statusCode == 200) {
				console.log(body);
				var jsonOut = fs.createWriteStream('data/json/'+ service.name +'.json');
				jsonOut.write(body);
				jsonOut.on('error', function(err) { console.log(err); });
				jsonOut.end();
			}
			else {
				console.log(error);
			}
		});
	}

	// TXT POLLING
	for(var i = 0; i < config.txtEndpoints.length; i++){

		var service = config.txtEndpoints[i];

		http.get({

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
	}

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