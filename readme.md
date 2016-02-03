Code
-------
The interesting code all resides in `server.js`
Change the `url` variable to the track you want to download (this must be a single track hypem page url for now)


Running
-------

0. Run `LaunchNodeServer.bat` to launch the node webserver
0. Visit [http://localhost:8081/scrape](http://localhost:8081/scrape) in a browser to trigger the scrape


Future Development Plans
-------

0. Support for multiple track urls (eg hypem favourites or popular) - download all tracks
0. UI for pasting the url to process
0. UI for selecting which tracks found at the url to download
0. Setting for number of concurrent downloads
0. Setting for number of Favourites pages to scrape