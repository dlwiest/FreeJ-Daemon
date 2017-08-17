const EventEmitter = require('events');
const https = require('https');
const SpotifyControl = require('spotify-control');
const chalk = require('chalk');

module.exports = class Spotify extends EventEmitter {
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
		super();
		this.spotify = null;
		this.connected = false;
		this.status = {
			isOnline: false,
			isPlaying: false,
			track: {},
			position: 0.0,
		};

		this.connect();
	}

	connect() {
		try {
			Spotify.retrieveToken().then((token) => {
				this.spotify = new SpotifyControl({
					token,
				});
				this.spotify.connect().then(() => {
					this.updatePlaybackStatus();
				})
					// Failed to connect to Spotify
					.catch(() => {
						this.setIsConnected(false);
						setTimeout(this.connect.bind(this), 1000);
					});
			})
				// Failed to retrieve Spotify token
				.catch(() => {
					this.setIsConnected(false);
					setTimeout(this.connect.bind(this), 1000);
				});
		} catch (err) {
			console.log(chalk.red(`Fatal connection error: ${err}`));
		}
	}

	updatePlaybackStatus() {
		this.spotify.status().then((result) => {
			this.setIsConnected(true);

			if (this.status.track.trackUri === result.track.track_resource.uri
				&& !result.playing_position
				&& this.status.position) {
				this.emit('songEnded');
			}

			this.setStatusProperty('isOnline', result.online);
			this.setStatusProperty('isPlaying', result.playing);
			this.setTrackObject({
				trackName: result.track.track_resource.name,
				trackUri: result.track.track_resource.uri,
				artistName: result.track.artist_resource.name,
				artistUri: result.track.artist_resource.uri,
				albumName: result.track.album_resource.name,
				albumUri: result.track.album_resource.uri,
				trackLength: result.track.length,
			});
			this.setStatusProperty('position', result.playing_position);

			setTimeout(this.updatePlaybackStatus.bind(this), 100);
		})
			.catch(() => {
				// Verify connection status
				setTimeout(this.connect.bind(this), 1000);
			});
	}

	setIsConnected(status) {
		if (this.connected !== status) {
			this.connected = status;
			if (this.connected) console.log(chalk.green('Established connection to Spotify client'));
			else console.log(chalk.orange('Lost connection to Spotify client'));
		}
	}

	setStatusProperty(prop, val) {
		if (this.status[prop] !== val && typeof val !== 'undefined') {
			this.status[prop] = val;
			this.emit('playbackStatusChanged', { [prop]: val });
		}
	}

	setTrackObject(track) {
		if (JSON.stringify(track) !== JSON.stringify(this.status.track)) {
			this.status.track = track;
			this.emit('playbackStatusChanged', { track });
		}
	}

	controlPlayStatus(play) {
		this.spotify.pause(!play);
	}

	controlPlayTrack(uri) {
		return new Promise((resolve, reject) => {
			this.spotify.play(uri)
				.then(() => resolve())
				.catch(() => reject());
		});
	}
};

