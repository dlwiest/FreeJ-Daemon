// server.js

const express = require('express');
const Spotify = require('./libs/spotify.js');
const WebApi = require('./libs/web_api.js');
const Playlist = require('./libs/playlist.js');

const spotify = new Spotify();
const playlist = new Playlist();
const webApi = new WebApi();

// Express configuration
const app = express();
const server = require('http').createServer(app);
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/demo', express.static('demo'));

// Express Routes
// TODO: Create some routes to return web API info for album art, search results, etc.
app.get('/test', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ message: 'test' }, null, 3));
});

// WebSocket configuration
const io = require('socket.io')(server);

// Playlist events
playlist.on('playlistUpdate', () => {
	io.emit('updatePlaylist', playlist.list);
});

// Spotify playback events
spotify.on('playbackStatusChanged', (change) => {
	io.emit('playbackStatusChanged', change);
});

spotify.on('songEnded', () => {
	const nextUri = playlist.next();
	if (nextUri) spotify.controlPlayTrack(nextUri);
});

// Handle individual WebSocket connections
io.on('connection', (client) => {
	const user = { id: client.request.connection.remoteAddress };
	client.emit('playbackStatus', spotify.status);
	client.emit('updatePlaylist', playlist.list);

	client.on('controlPlayStatus', (play) => {
		spotify.controlPlayStatus(play);
	});

	client.on('addSong', (song) => {
		webApi.getTrackInfo(song)
			.then((response) => {
				playlist.addSong(user, response.body);
				// If this is the first unplayed song on the list, start playing
				if (playlist.list.filter(s => s.status !== 'finished').length === 1) {
					spotify.controlPlayTrack(playlist.next());
				}
			})
			.catch(() => {});
	});
});

server.listen(3001);
