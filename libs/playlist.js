module.exports = class Playlist {
	constructor(spotify) {
		this.spotify = spotify;
		this.spotify.on('songEnded', () => {
			console.log('IT\'S OVER');
		});

		this.list = {
			nodes: [
			],
		};
	}

	addSong(user, song) {
		// If the playlist is empty, start with this song
		this.spotify.controlPlayTrack(song)
			.then(() => {
				// Remove it from the list
			});
	}
};
