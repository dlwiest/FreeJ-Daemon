const SpotifyWebAPI = require('spotify-web-api-node');

const config = require('../config.json');

module.exports = class WebApi {
	constructor() {
		this.authorized = false;

		this.spotifyWebApi = new SpotifyWebAPI({
			"clientId": config.webApi.id,
			"clientSecret": config.webApi.secret,
		});

		this.auth();
	}

	auth() {
		this.spotifyWebApi.clientCredentialsGrant().then(data => {
			this.spotifyWebApi.setAccessToken(data.body['access_token']);
			this.authorized = true;
			// Refresh token every 30 minutes
			setTimeout(this.auth.bind(this), 30 * 60 * 1000);
		}, problem => {
			console.error("Problem authenticating with the Spotify Web API:");
			console.error(problem);
			this.authorized = false;
			// Try again in 30 seconds
			setTimeout(this.auth.bind(this), 30 * 1000);
		});
	}

	getTrackInfo(trackId) {
		return new Promise((resolve, reject) => {
			this.spotifyWebApi.getTrack(trackId)
			.then(data => {
				resolve(data);
			})
				.catch(() => reject());
		});
	}
}