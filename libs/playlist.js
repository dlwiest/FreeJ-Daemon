// playlist.js

const UIDGenerator = require('uid-generator');

module.exports = class Playlist {
	constructor() {
		this.uidGen = new UIDGenerator();

		this.pods = [];
		this.list = [];
	}

	rebuildPlaylist() {
		const newList = [];
		this.pods.forEach((pod) => {
			pod.songs.forEach((song) => {
				newList.push(song);
			});
		});
		this.list = newList;
	}

	addSong(user, song) {
		const trackInfo = {
			trackName: song.name,
			trackUri: song.uri,
			artistName: song.artists[0].name,
			artistUri: song.artists[0].uri,
			albumName: song.album.name,
			albumUri: song.album.uri,
		};

		// Find the first pod that doesn't contain any picks from this user
		const pod = this.pods.find((p) => {
			if (!p.songs.find(s => s.selectedBy.id === user.id)) {
				return p;
			}
			return null;
		});

		if (pod) {
			// Add the song to the existing pod
			pod.songs.push({
				id: this.uidGen.generateSync(),
				selectedAt: new Date(),
				selectedBy: user,
				trackInfo,
				status: 'pending',
			});
		} else {
			// Create a new pod with the song
			const newPod = {
				id: this.uidGen.generateSync(),
				createdAt: new Date(),
				songs: [{
					id: this.uidGen.generateSync(),
					selectedAt: new Date(),
					selectedBy: user,
					trackInfo,
					status: 'pending',
				}],
			};
			this.pods.push(newPod);
		}
		this.rebuildPlaylist();
	}

	next() {
		// Mark the current song as finished
		const nowPlaying = this.list.find(song => song.status === 'playing');
		if (nowPlaying) nowPlaying.status = 'finished';

		// Mark the next pending song as playing and return the URI
		const next = this.list.find(song => song.status === 'pending');
		if (next) {
			next.status = 'playing';
			return next.trackInfo.trackUri;
		}
		return null;
	}
};
