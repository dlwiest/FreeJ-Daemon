const Spotify = require('./libs/spotify.js');
const server = require('http').createServer();
const io = require('socket.io')(server);
const spotify = new Spotify();

spotify.on('playbackStatusChanged', (change) => {
	//console.log(change);
});

io.on('connection', (client) => {
	console.log('a client has connected');
	client.emit('playbackStatus', spotify.status);

	client.on('disconnect', () => {
		console.log('a client has disconnected');
	});

	spotify.on('playbackStatusChanged', (change) => {
		client.emit('playbackStatusChanged', change);
	});
});


server.listen(3001);
