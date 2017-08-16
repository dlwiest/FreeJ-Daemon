module.exports = class Playlist {
	constructor(spotify) {
		this.spotify = spotify;

		this.list = {
			nodes: [
			],
		};
	}

	addSong(song) {
		this.spotify.controlPlayTrack(song)
			.then(() => {
				// Remove it from the list
			});
	}
};
