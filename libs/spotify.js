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
		this.spotify = null;
		this.connected = false;

		this.connect();
	}

	connect() {
		this.setConnectedStatus(false);
		Spotify.generateToken().then((token) => {
			this.spotify = new SpotifyControl({
				token,
			});
			this.spotify.connect().then(() => {
				this.updatePlaybackStatus();
			})
				.catch(() => setTimeout(this.connect.bind(this), 1000));
		})
			.catch(() => setTimeout(this.connect.bind(this), 1000));
	}

	updatePlaybackStatus() {
		this.spotify.status().then((result) => {
			if (result && result.online) {
				this.setConnectedStatus(true);
				setTimeout(this.updatePlaybackStatus.bind(this), 100);
			} else this.setConnectedStatus(false);
		})
			.catch(() => {
				this.setConnectedStatus(false);
				this.connect();
			});
	}

	setConnectedStatus(status) {
		if (status !== this.connected) {
			this.connected = status;
			if (this.connected) console.log('Established connection to Spotify client');
			else {
				console.log('Lost connection to Spotify client');
				setTimeout(this.connect.bind(this), 1000);
			}
		}
	}
};

