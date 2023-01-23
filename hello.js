const app = require('express')();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
require('dotenv').config();
const cors = require('cors');

const port = process.env.PORT || 5000;

app.use(cors());

app.get('/', async (req, res) => {
	res.send({ hello: 'mom' });
});

const io = new Server(server, {
	cors: {
		origin: '*',
	},
});

io.on('connection', socket => {
	console.log('connected');
	socket.emit('me', socket.id);

	socket.on('disconnect', () => {
		socket.broadcast.emit('share-end');
	});

	socket.on('test', txt => {
		io.emit('test2', txt);
	});

	socket.on('signal', ({ signal }) => {
	console.log('sending signal');
		
		socket.broadcast.emit('receive', { signal });
	});
	
	
	socket.on('manual-stream', data => {
		socket.broadcast.emit('manual-receive', data);
	});

	// socket.on('receive-server', ({ signal, to }) => {
	// 	io.to(to).emit('callaccepted', { signal });
	// });
});

server.listen(port, () => console.log(`server listening on ${port}`));
