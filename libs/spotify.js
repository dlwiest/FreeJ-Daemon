const https = require('https');
const SpotifyControl = require('spotify-control');

module.exports = class Spotify {
	static generateToken() {
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
		this.connected = false;
		this.spotify = null;

		this.connect();
	}

	connect() {
		this.connected = false;
		Spotify.generateToken().then((token) => {
			this.spotify = new SpotifyControl({
				token,
			});
			this.spotify.connect().then(() => {
				this.connected = true;
				console.log('Established connection to Spotify client');
				this.updatePlaybackStatus();
			})
				.catch(() => setTimeout(this.connect.bind(this), 1000));
		})
			.catch(() => setTimeout(this.connect.bind(this), 1000));
	}

	updatePlaybackStatus() {
		if (this.connected) {
			this.spotify.status().then((result) => {
				console.log(result);
				setTimeout(this.updatePlaybackStatus.bind(this), 100);
			})
				.catch(() => {
					this.connected = false;
					console.log('Lost connection to Spotify client');
					this.connect();
				});
		}
	}
};

