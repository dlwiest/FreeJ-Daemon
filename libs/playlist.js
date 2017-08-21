// playlist.js

const EventEmitter = require('events');
const UIDGenerator = require('uid-generator');
const fs = require('fs');

module.exports = class Playlist extends EventEmitter {
	constructor() {
		super();
		this.uidGen = new UIDGenerator();

		this.pods = [];
		this.list = [];

		// Attempt to restore pending tracks in the playlist
		if (fs.existsSync('./pods.json')) {
			const result = fs.readFileSync('./pods.json', 'utf-8');
			if (result) {
				this.pods = JSON.parse(result);
				this.rebuildPlaylist();
			}
		}
	}

	rebuildPlaylist() {
		const newList = [];

		if (this.pods.length) {
			this.list = this.pods.reduce((prev, cur) => prev.concat(cur.songs), []);
			this.backupPods();
			this.emit('playlistUpdate');
		}
	}

	backupPods() {
		// Back up pods that haven't expired for persistence (in case of server restarts, etc.)
		fs.writeFile('./pods.json', JSON.stringify(this.pods.filter(p => !p.expired)), 'utf8', () => {});
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

		// Find the first pod that doesn't contain any picks from this user and hasn't expired
		const pod = this.pods.find((p) => {
			if (!p.expired && !p.songs.find(s => s.selectedBy.id === user.id)) {
				return p;
			}
			return null;
		});

		// Synchronously generate a song ID
		this.uidGen.generate((songIdErr, songId) => {
			if (!songIdErr) {
				if (pod) {
					// Add the song to the existing pod
					pod.songs.push({
						id: songId,
						selectedAt: new Date(),
						selectedBy: user,
						trackInfo,
						status: 'pending',
					});
					this.rebuildPlaylist();
				} else {
					// Synchronously generate a pod ID and add the song to a new pod
					this.uidGen.generate((podIdErr, podId) => {
						if (!podIdErr) {
							const newPod = {
								id: podId,
								createdAt: new Date(),
								expired: false,
								songs: [{
									id: songId,
									selectedAt: new Date(),
									selectedBy: user,
									trackInfo,
									status: 'pending',
								}],
							};
							this.pods.push(newPod);
							this.rebuildPlaylist();
						}
					});
				}
			}
		});
	}

	next() {
		// Mark the current song as finished
		const nowPlaying = this.list.find(song => song.status === 'playing');
		if (nowPlaying) {
			nowPlaying.status = 'finished';

			// Expire the pod if necessary
			const pod = this.pods.find(p => p.songs.find(s => s.id === nowPlaying.id));
			if (!pod.songs.filter(s => s.status !== 'finished').length) pod.expired = true;
		}

		this.backupPods();

		// Mark the next pending song as playing and return the URI
		const next = this.list.find(song => song.status === 'pending');
		if (next) {
			next.status = 'playing';
			this.emit('playlistUpdate');
			return next.trackInfo.trackUri;
		}
		this.emit('playlistUpdate');
		return null;
	}
};
