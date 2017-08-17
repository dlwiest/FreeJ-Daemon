const socket = io.connect();
let trackLength = 0.0;

const addSong = () => {
	this.event.preventDefault();
	const selected = document.getElementById('new-song').value;
	socket.emit('addSong', selected);
};

const playButton = `
	<a href="#" class="btn btn-primary btn-sm btn-success"
	style="padding-left: 0.8em; padding-right: 0.8em"
	onClick="togglePlay(true)">
		<i class="fa fa-play" aria-hidden="true"></i>
	</a>
`;

const pauseButton = `
	<a href="#" class="btn btn-primary btn-sm btn-danger"
	style="padding-left: 0.8em; padding-right: 0.8em"
	onClick="togglePlay(false)">
		<i class="fa fa-pause" aria-hidden="true"></i>
	</a>
`;

const togglePlay = (play) => {
	socket.emit('controlPlayStatus', play);
};

const processElement = (key, value) => {
	switch (key) {
	case 'isPlaying':
		if (value) {
			document.getElementById('progress-bar-container').className = 'progress progress-striped active';
			document.getElementById('control-play-pause').innerHTML = pauseButton;
		}
		else {
			document.getElementById('progress-bar-container').className = 'progress';
			document.getElementById('control-play-pause').innerHTML = playButton;
		}
		break;
	case 'trackName':
		document.getElementById('song-name').innerText = value;
		break;
	case 'artistName':
		document.getElementById('artist-name').innerText = value;
		break;
	case 'albumName':
		document.getElementById('album-name').innerText = value;
		break;
	case 'trackLength':
		trackLength = value;
		break;
	case 'position':
		const formattedCurTime = moment("1900-01-01 00:00:00").add(value, 'seconds').format("mm:ss");
		document.getElementById('progress-time-current').innerText = formattedCurTime;
		if (trackLength) {
			const progress = (value / trackLength) * 100;
			document.getElementById('progress-bar').style.width = progress + '%';
		}
	}
};

const processStatus = (status) => {
	for (let statusKey in status) {
		if (statusKey === 'track') {
			const track = status[statusKey];
			for (let trackKey in track) processElement(trackKey, track[trackKey]);
		} else processElement(statusKey, status[statusKey]);
	}
};

const processStatusUpdate = (update) => {
	const key = Object.keys(update)[0];
	const value = update[key];
	if (key === 'track') {
		for (let trackKey in value) processElement(trackKey, value[trackKey]);
	} else processElement(key, value);
};

const updatePlaylist = (newList) => {
	const element = document.getElementById('playlist-group');
	element.innerHTML = '';
	newList.forEach((song) => {
		console.log(song);
		element.innerHTML += `
			<li class="list-group-item ${song.status === 'playing' ? 'list-group-item-success' : null}">${song.trackInfo.trackName} - <small>${song.trackInfo.artistName}</li>
		`;
	});
};

socket.on('playbackStatus', status => processStatus(status));
socket.on('playbackStatusChanged', update => processStatusUpdate(update));
socket.on('updatePlaylist', newList => updatePlaylist(newList));
