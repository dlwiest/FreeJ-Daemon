const url = require('url');
const fs = require('fs');

const Spotify = require('./libs/spotify.js');
const WebApi = require('./libs/web_api.js');

const spotify = new Spotify();
const webApi = new WebApi();

const server = require('http').createServer((request, response) => {
	// Serve the demo file
	const path = url.parse(request.url).pathname;
	if (path === '/demo/') {
		fs.readFile('./demo/index.html', (error, data) => {
			if (error) {
				response.writeHead(404);
				response.write("404'd!");
				response.end();
			} else {
				response.writeHead(200, { 'Content-Type': 'text/html' });
				response.write(data, 'utf8');
				response.end();
			}
		});
	} else if (path === '/demo/script.js') {
		fs.readFile('./demo/script.js', (error, data) => {
			if (!error) {
				response.writeHead(200, { 'Content-Type': 'text/html' });
				response.write(data, 'utf8');
				response.end();
			}
		});
	}
});

const io = require('socket.io')(server);

spotify.on('playbackStatusChanged', (change) => {
	io.emit('playbackStatusChanged', change);
});

io.on('connection', (client) => {
	client.emit('playbackStatus', spotify.status);

	client.on('controlPlayStatus', (play) => {
		spotify.controlPlayStatus(play);
	});

	client.on('addSong', (song) => {
		webApi.getTrackInfo(song)
			.then((response) => {
				//console.log(response);
				console.log('success');
			})
			.catch(() => console.log('Bad track id'));
	});
});


server.listen(3001);