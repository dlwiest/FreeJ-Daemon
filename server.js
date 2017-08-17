// server.js

const express = require('express');
const Spotify = require('./libs/spotify.js');
const WebApi = require('./libs/web_api.js');
const Playlist = require('./libs/playlist.js');

const spotify = new Spotify();
const playlist = new Playlist(spotify);
const webApi = new WebApi();

// Express configuration
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/demo', express.static('demo'));

// Express Routes
app.get('/test', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ message: 'test' }, null, 3));
});

// WebSocket configuration
const io = require('socket.io')(server);

// Update sockets on playback and list changes
spotify.on('playbackStatusChanged', (change) => {
	io.emit('playbackStatusChanged', change);
});

playlist.on('updatePlaylist', (newList) => {
	io.emit('updatePlaylist', newList);
});

// Handle individual WebSocket connections
io.on('connection', (client) => {
	const user = { id: client.request.connection.remoteAddress };
	client.emit('playbackStatus', spotify.status);
	client.emit('updatePlaylist', playlist.playlist);

	client.on('controlPlayStatus', (play) => {
		spotify.controlPlayStatus(play);
	});

	client.on('addSong', (song) => {
		webApi.getTrackInfo(song)
			.then((response) => {
				playlist.addSong(user, response.body);
			})
			.catch(() => {});
	});
});

server.listen(3001);
