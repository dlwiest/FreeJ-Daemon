const Spotify = require('./libs/spotify.js');
const server = require('http').createServer();
const io = require('socket.io')(server);
const spotify = new Spotify();

spotify.on('playbackStatusChanged', (change) => {
	//console.log(change);
});

io.on('connection', (client) => {
	client.emit('playbackStatus', spotify.status);

	spotify.on('playbackStatusChanged', (change) => {
		client.emit('playbackStatusChanged', change);
	});

	client.on('disconnect', () => {
		// Disconnect code
	});
});


server.listen(3001);
