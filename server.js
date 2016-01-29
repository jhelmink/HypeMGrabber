// 3rd Party dependencies
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
// Core dependencies
var fs = require('fs');
var exec = require('child_process').exec;

var app = express();

// Globals
var artist, title, remix, source_url, stream_url;
var downloadDir = './downloads/';
var fakeUserAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36';
// Let's scrape a single track for testing
var url = 'http://hypem.com/track/2f0fh';

// Scrape the page url for hypem tracks
// https://scotch.io/tutorials/scraping-the-web-with-node-js
app.get('/scrape', function (req, res) {
	console.log('Starting scrape');

	// We need to use control flow for async calls to the hypem server
	// https://github.com/caolan/async#seriestasks-callback
	// http://www.sebastianseilund.com/nodejs-async-in-practice
	async.series([
	    function(callback) { // First we get the Track details and stream source URL
			getMainPageData(url, callback);
		},
		function(callback) { // Now we get the track stream data from the source url
			getStreamData(source_url, callback);
		},
		function(callback) { // Finally download the file using wget for the stream
			downloadFileWget (stream_url, callback);
		},
	]);
});

function getMainPageData(url, callback) {
	console.log('Get Main Page Data - url: ' + url);
	request({ 
		url: url,
			headers: {
				'User-Agent': fakeUserAgent
			}
		},
		function (error, response, html) {
			if (!error) {
				var $ = cheerio.load(html);

				$('.artist').filter(function () {
					var data = $(this);
					artist = data.text();
				})

				$('.base-title').filter(function () {
					var data = $(this);
					title = data.text();
				})

				remix = ''; // If there is no remix
				$('.remix-link').filter(function () {
					var data = $(this);
					remix = data.text();
				})

				$('#displayList-data').filter(function () {
					var data = $(this);
					var scriptData = JSON.parse(data.text());
					var id = scriptData.tracks[0].id;
					var key = scriptData.tracks[0].key;
					source_url = 'http://hypem.com/serve/source/' + id + '/' + key;
					console.log('Source URL: ' + source_url);
				})

				console.log('Track to process: ' + getFileName());
				callback();
			} else {
				console.log('Failed to request url: ' + url);
			}
		}
	);
}

function getStreamData(source_url, callback) {
	console.log('Get Stream Data - url:' + source_url);
	request({ 
		url: source_url,
			headers: {
				'User-Agent': fakeUserAgent
			}
		},
		function (error, response, jsonData) {	
			if (!error) {
				if(jsonData.indexOf('Error 403') > -1) {
					console.log('We be blocked.');
				} else {
					var trackStreamData = JSON.parse(jsonData);
					stream_url = trackStreamData.url;
					console.log('Stream URL: ' + stream_url);
					callback();
				}
			} else {
				console.log('Failed to request track json data from source url: ' + url);
			}
		}
	);
}

// Use wget to do the download as it handles streams
// http://www.hacksparrow.com/using-node-js-to-download-files.html
function downloadFileWget (stream_url, callback) {
	var fileName = getFileName();
	// Compose the wget command
	var wget = 'wget --output-document="' + downloadDir + fileName + '.mp3" ' + stream_url;
	console.log(wget);
	// Execute wget using child_process exec function
	var child = exec(
		wget, 
		function (err, stdout, stderr) {
			if (err) {
				throw err;
			} else {
				console.log(fileName + ' downloaded to ' + downloadDir);
				callback();
			}
		}
	);
}

function getFileName() {
	var fileName = artist + ' - ' + title;
	if(remix != '') {
		fileName = fileName + ' (' + remix + ')';
	}
	return fileName;
}

app.listen('8081');
console.log('Visit http://localhost:8081/scrape in a browser to start');
exports = module.exports = app;
