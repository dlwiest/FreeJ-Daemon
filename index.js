const Spotify = require('./libs/spotify.js');
const server = require('http').createServer();
const io = require('socket.io')(server);
const spotify = new Spotify();

spotify.on('playbackStatusChanged', (change) => {
	io.emit('playbackStatusChanged', change);
});

io.on('connection', (client) => {
	client.emit('playbackStatus', spotify.status);

	client.on('controlPlayStatus', (play) => {
		spotify.controlPlayStatus(play);
	});
});


server.listen(3001);
