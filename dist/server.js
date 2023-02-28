import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import cors from 'cors';
import { instrument } from '@socket.io/admin-ui';
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
instrument(io, {
    auth: false,
    mode: 'development',
});
(() => {
    io.on('connection', socket => {
        socket.on('join-room', roomId => {
            console.log('user joined', roomId);
            socket.join(roomId);
            socket.emit('joined-room', roomId);
            socket.to(roomId).emit('friend-joined-room', {
                whoJoinedId: socket.handshake.auth.userId,
                whoJoinedSockId: socket.id,
            });
        });
        socket.on('create-receive-peer', ({ toWhomId, toWhomSockId, roomId }) => {
            if (toWhomSockId) {
                io.to(toWhomSockId).emit('create-receive-peer', {
                    fromWhomId: socket.handshake.auth.userId,
                    fromWhomSockId: socket.id,
                });
            }
            else {
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
        socket.on('send-signal-to-friend', ({ toWhomId, toWhomSockId, signal, roomId }) => {
            if (toWhomSockId) {
                io.to(toWhomSockId).emit('receive-signal-from-friend', {
                    fromWhomId: socket.handshake.auth.userId,
                    signal,
                });
            }
            else {
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
        console.log('I am connected and working', socket.handshake.auth.userId);
        socket.on('logging-out', ({ roomId }) => {
            socket.to(roomId).emit('friend-logged-out', { who: socket.handshake.auth.userId });
            console.log('logging out ', socket.handshake.auth.userId);
        });
        socket.on('send-message', ({ roomId, ...data }) => {
            console.log(data, roomId);
            io.to(roomId).emit('receive-message', data);
        });
        socket.on('disconnecting', () => {
            const id = socket.id;
            const allRooms = socket.rooms;
            const filteredRoom = new Set(allRooms);
            filteredRoom.delete(id);
            const roomArray = Array.from(filteredRoom);
            roomArray.forEach(room => {
                console.log(id, room, 'disconnecting', socket.handshake.auth.userId);
                socket.to(room).emit('friend-logged-out', { who: socket.handshake.auth.userId });
            });
        });
    });
})();
server.listen(port, () => console.log(`server listening on ${port}`));
