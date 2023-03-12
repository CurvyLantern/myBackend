import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import cors from 'cors';
import { app, server } from './app.js';
import io from './socket.js';
dotenv.config();

const port = process.env.PORT || 5000;

app.use(cors());

app.get('/', async (req, res) => {
	res.send({ hello: 'mom' });
});
app.get('/roomId', async (req, res) => {
	const id = nanoid(10);
	res.status(200).send({ id });
});

(() => {
	io.on('connection', socket => {
		// socket.on('routine-report', async ({ roomId }) => {
		// 	console.log('received report');
		// 	const sockMap = await io.in(roomId).fetchSockets();
		// 	let allUserId = [];
		// 	for (let sock of sockMap) {
		// 		allUserId.push(sock.handshake.auth.userId);
		// 	}
		// 	console.log('clearing up event emitting');
		// 	io.to(roomId).emit('receive-report', { allUserId });
		// });

		//complete don't touch
		socket.on('join-room', roomId => {
			console.log('user joined', roomId);
			// join the room
			socket.join(roomId);
			socket.emit('joined-room', roomId);
			// notify everyone else that you have joined
			socket.to(roomId).emit('friend-joined-room', {
				whoJoinedId: socket.handshake.auth.userId,
				whoJoinedSockId: socket.id,
			});
		});

		//complete don't touch
		socket.on('create-receive-peer', ({ toWhomId, toWhomSockId, roomId }) => {
			if (toWhomSockId) {
				io.to(toWhomSockId).emit('create-receive-peer', {
					fromWhomId: socket.handshake.auth.userId,
					fromWhomSockId: socket.id,
				});
			} else {
				(async () => {
					const sockMap = await io.in(roomId).fetchSockets();
					for (let sock of sockMap) {
						if (sock.handshake.auth.userId === toWhomId) {
							io.to(sock.id).emit('create-receive-peer', {
								fromWhomId: socket.handshake.auth.userId,
								fromWhomSockId: socket.id,
							});
							break;
						}
					}
				})();
			}
		});

		//complete don't touch
		socket.on('send-signal-to-friend', ({ toWhomId, toWhomSockId, signal, roomId }) => {
			if (toWhomSockId) {
				io.to(toWhomSockId).emit('receive-signal-from-friend', {
					fromWhomId: socket.handshake.auth.userId,
					signal,
				});
			} else {
				(async () => {
					const sockMap = await io.in(roomId).fetchSockets();
					for (let sock of sockMap) {
						if (sock.handshake.auth.userId === toWhomId) {
							io.to(sock.id).emit('receive-signal-from-friend', {
								fromWhomId: socket.handshake.auth.userId,
								signal,
							});

							break;
						}
					}
				})();
			}
		});
		// socket.on('connect-to-friend', ({ from, to, signal, roomId }) => {
		// 	if (to) {
		// 		io.to(to).emit('on-req-to-connect', {
		// 			from: socket.handshake.auth.userId,
		// 			signal,
		// 		});
		// 	} else {
		// 		(async () => {
		// 			const sockMap = await io.in(roomId).fetchSockets();
		// 			for (let sock of sockMap) {
		// 				if (sock.handshake.auth.userId === from) {
		// 					io.to(sock.id).emit('on-req-to-connect', {
		// 						from: socket.handshake.auth.userId,
		// 						signal,
		// 					});
		// 				}
		// 			}
		// 		})();
		// 	}
		// });

		console.log('I am connected and working', socket.handshake.auth.userId);

		socket.on('logging-out', ({ roomId }) => {
			socket.to(roomId).emit('friend-logged-out', { who: socket.handshake.auth.userId });
			console.log('logging out ', socket.handshake.auth.userId);
		});

		socket.on('send-message', ({ roomId, ...data }) => {
			console.log(data, roomId);
			io.to(roomId).emit('receive-message', data);
		});

		socket.on('disconnect', reason => {
			const id = socket.id;
			const allRooms = socket.rooms;
			console.log({ disconnected: reason });
		});

		// socket.on('complete-connection', ({ signal, toWhomId, toWhomSockId }) => {
		// 	io.to(toWhomSockId).emit('on-final-signal', { from: socket.handshake.auth.userId, signal });
		// });
		// a socket joins do something
		// socket wants to join a room
	});
})();

// (() => {
// 	io.on('connection', socket => {
// 		// socket.on('routine-report', async ({ roomId }) => {
// 		// 	console.log('received report');
// 		// 	const sockMap = await io.in(roomId).fetchSockets();
// 		// 	let allUserId = [];
// 		// 	for (let sock of sockMap) {
// 		// 		allUserId.push(sock.handshake.auth.userId);
// 		// 	}
// 		// 	console.log('clearing up event emitting');
// 		// 	io.to(roomId).emit('receive-report', { allUserId });
// 		// });
// 		socket.on('logging-out', ({ roomId }) => {
// 			io.to(roomId).emit('friend-logged-out', { who: socket.handshake.auth.userId });
// 			console.log('logging out ', socket.handshake.auth.userId);
// 		});
// 		socket.on('connect-to-friend', ({ from, to, signal }) => {
// 			io.to(to).emit('on-req-to-connect', {
// 				from: socket.handshake.auth.userId,
// 				signal,
// 			});
// 		});
// 		socket.on('complete-connection', ({ signal, to }) => {
// 			io.to(to).emit('on-final-signal', { from: socket.handshake.auth.userId, signal });
// 		});

// 		// a socket joins do something

// 		// socket wants to join a room
// 		socket.on('join-room', roomId => {
// 			// join the room
// 			socket.join(roomId);
// 			socket.emit('joined-room', roomId);

// 			// notify everyone else that you have joined
// 			socket.broadcast.emit('friend-joined-room', {
// 				from: socket.handshake.auth.userId,
// 				sockId: socket.id,
// 			});
// 		});
// 	});
// })();

server.listen(port, () => console.log(`server listening on ${port}`));
