import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
const app = express();
const server = createServer(app);
const port = process.env.PORT || 5000;
app.use(cors());
app.get('/', async (req, res) => {
    res.send({ hello: 'mom' });
});
app.get('/roomId', async (req, res) => {
    const id = nanoid(10);
    res.status(200).send({ id });
});
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});
let roomQueue = [];
(() => {
    io.on('connection', socket => {
        socket.on('leave-room', ({ roomId }) => {
            socket.leave(roomId);
        });
        socket.on('host:leave-room', ({ roomId }) => {
            socket.broadcast.to(roomId).emit('host-left');
            socket.leave(roomId);
        });
        socket.on('create-room', roomId => {
            socket.join(roomId);
            roomQueue.push(roomId);
            console.log(roomQueue);
        });
        socket.on('user-join-room', roomId => {
            socket.join(roomId);
        });
        socket.on('connect-to-user', async ({ userId, roomId, signal }) => {
            const sockets = await io.in(roomId).fetchSockets();
            for (let socket of sockets) {
                if (socket.handshake.auth.userId === userId) {
                    io.to(socket.id).emit('host-signal', { signal });
                    break;
                }
            }
        });
        socket.on('connect-with-host', async ({ socketId, userId, roomId, signal }) => {
            const findSockets = await io.in(roomId).fetchSockets();
            for (let sock of findSockets) {
                if (sock.handshake.auth.isHosting === 'yes') {
                    sock.emit('host:on-client-connect', {
                        signal,
                        userId,
                    });
                    break;
                }
            }
        });
        socket.on('client:connect-from-host', async ({ userId, signal, roomId }) => {
            console.log('received client:connect-from-host');
            const sockets = await io.in(roomId).fetchSockets();
            for (let sock of sockets) {
                if (sock.handshake.auth.userId === userId) {
                    io.to(sock.id).emit('signal-from-host', {
                        signal,
                    });
                    break;
                }
            }
        });
    });
    io.of('/').adapter.on('join-room', async (room, id) => {
        if (roomQueue.includes(room)) {
            const findSockets = await io.in(room).fetchSockets();
            for (let socket of findSockets) {
                if (socket.handshake.auth.isHosting === 'yes') {
                    const user = io.of('/').sockets.get(id);
                    const userObj = {
                        userId: user === null || user === void 0 ? void 0 : user.handshake.auth.userId,
                        socketId: id,
                        roomId: room,
                    };
                    socket.emit('user-joined', userObj);
                    break;
                }
            }
        }
    });
})();
server.listen(port, () => console.log(`server listening on ${port}`));
