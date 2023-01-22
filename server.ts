import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
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
	socket.emit('me', socket.id);

	socket.on('disconnect', () => {
		socket.broadcast.emit('callended');
	});

	socket.on('signal', ({ signal }) => {
		socket.broadcast.emit('receive', { signal });
	});

	// socket.on('receive-server', ({ signal, to }) => {
	// 	io.to(to).emit('callaccepted', { signal });
	// });
});

server.listen(port, () => console.log(`server listening on ${port}`));
