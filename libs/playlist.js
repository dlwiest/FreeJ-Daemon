const EventEmitter = require('events');
const UIDGenerator = require('uid-generator');

module.exports = class Playlist extends EventEmitter {
	constructor(spotify) {
		super();
		this.uidgen = new UIDGenerator();
		this.spotify = spotify;
		this.spotify.on('songEnded', () => {
			this.playNext();
		});

		this.pods = [];
		this.playlist = [];
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
				id: this.uidgen.generateSync(),
				selectedAt: new Date(),
				selectedBy: user,
				trackInfo,
				status: 'pending',
			});
		} else {
			// Create a new pod with the song
			const newPod = {
				id: this.uidgen.generateSync(),
				createdAt: new Date(),
				songs: [{
					id: this.uidgen.generateSync(),
					selectedAt: new Date(),
					selectedBy: user,
					trackInfo,
					status: 'pending',
				}],
			};
			this.pods.push(newPod);
		}
		this.rebuildPlaylist();

		// Start the next song on the playlist if nothing is playing currently
		if (!this.spotify.status.isPlaying) this.playNext();
	}

	rebuildPlaylist() {
		const newList = [];
		this.pods.forEach((pod) => {
			pod.songs.forEach((song) => {
				newList.push(song);
			});
		});
		this.playlist = newList;
		this.emit('updatePlaylist', this.playlist);
	}

	playNext() {
		// Mark whatever is currently playing as complete
		const nowPlaying = this.playlist.find(song => song.status === 'playing');
		if (nowPlaying) nowPlaying.status = 'finished';

		// Play the next pending song on the list
		const next = this.playlist.find(song => song.status === 'pending');
		this.spotify.controlPlayTrack(next.trackInfo.trackUri)
			.then(() => {
				next.status = 'playing';
				this.emit('updatePlaylist', this.playlist);
			});
	}
};
