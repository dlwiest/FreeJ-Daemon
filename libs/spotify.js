const https = require('https');
const SpotifyControl = require('spotify-control');

module.exports = class Spotify {
	static retrieveToken() {
		return new Promise((resolve, reject) => {
			const options = {
				host: 'open.spotify.com',
				path: '/token',
				headers: {
					'User-Agent': 'request',
				},
			};
			let responseStr = '';

			https.request(options, (response) => {
				if (response.statusCode !== 200) reject();
				else {
					response.on('data', (chunk) => {
						if (chunk !== undefined) responseStr += chunk;
					});
					response.on('end', () => {
						resolve(JSON.parse(responseStr).t);
					});
				}
			}).end();
		});
	}

	constructor() {
		this.spotify = null;
		this.connected = false;
		this.status = {
			isOnline: false,
			isPlaying: false,
			position: 0.0,
		};

		this.connect();
	}

	connect() {
		Spotify.retrieveToken().then((token) => {
			this.spotify = new SpotifyControl({
				token,
			});
			this.spotify.connect().then(() => {
				this.updatePlaybackStatus();
			})
				// Failed to connect to Spotify
				.catch(() => setTimeout(this.connect.bind(this), 1000));
		})
			// Failed to retrieve Spotify token
			.catch(() => setTimeout(this.connect.bind(this), 1000));
	}

	updatePlaybackStatus() {
		this.spotify.status().then((result) => {
			this.setIsConnected(true);
			this.setStatusProperty('isOnline', result.online);
			this.setStatusProperty('isPlaying', result.playing);
			this.setStatusProperty('position', result.playing_position);

			setTimeout(this.updatePlaybackStatus.bind(this), 100);
		})
			.catch(() => {
				this.setIsConnected(false);
				setTimeout(this.connect.bind(this), 1000);
			});
	}

	setIsConnected(status) {
		if (this.connected !== status) {
			this.connected = status;
			if (this.connected) console.log('Established connection to Spotify client');
			else console.log('Lost connection to Spotify client');
		}
	}

	setStatusProperty(prop, val) {
		if (this.status[prop] !== val) {
			this.status[prop] = val;
			console.log(`${prop}: ${val}`);
		}
	}
};

