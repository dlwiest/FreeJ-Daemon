const fs = require('fs');
const childProcess = require('child_process');
const chalk = require('chalk');

const launch = (path) => {
	const process = childProcess.fork(path);
	process.on('error', (err) => {
		console.log(chalk.red(`Fatal error: ${err}`));
		console.log(chalk.yellow('Attempting to relaunch...'));
		launch('./spotify.js');
	});
};

if (!fs.existsSync('./config.json')) {
	console.log(chalk.red('Unable to launch: config.json is missing'));
	process.exit();
}

launch('./daemon.js');
