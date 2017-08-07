const http = require('http');
const Spotify = require('./libs/spotify.js');

const spotify = new Spotify();

const port = 3001;

const server = http.createServer((request, response) => {
	// Connection established
});

server.listen(port);
