const http = require('http');

const hostname = 'localhost';
const port = 3001;

const server = http.createServer((request, response) => {
	console.log(request);
	console.log(response);
});