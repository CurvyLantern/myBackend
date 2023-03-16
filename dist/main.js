var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import cors from 'cors';
import app from './app.js';
import { createServer } from 'http';
import { instrument } from '@socket.io/admin-ui';
import { Server } from 'socket.io';
dotenv.config();
const server = createServer(app);
const port = process.env.PORT || 8000;
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});
instrument(io, {
    auth: false,
    mode: 'development',
});
app.use(cors());
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send({ hello: 'mom' });
}));
app.get('/roomId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = nanoid(10);
    res.status(200).send({ id });
}));
(() => {
    io.on('connection', socket => {
        console.log('socket is connected');
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
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    const sockMap = yield io.in(roomId).fetchSockets();
                    for (let sock of sockMap) {
                        if (sock.handshake.auth.userId === toWhomId) {
                            io.to(sock.id).emit('create-receive-peer', {
                                fromWhomId: socket.handshake.auth.userId,
                                fromWhomSockId: socket.id,
                            });
                            break;
                        }
                    }
                }))();
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
                (() => __awaiter(void 0, void 0, void 0, function* () {
                    const sockMap = yield io.in(roomId).fetchSockets();
                    for (let sock of sockMap) {
                        if (sock.handshake.auth.userId === toWhomId) {
                            io.to(sock.id).emit('receive-signal-from-friend', {
                                fromWhomId: socket.handshake.auth.userId,
                                signal,
                            });
                            break;
                        }
                    }
                }))();
            }
        });
        console.log('I am connected and working', socket.handshake.auth.userId);
        socket.on('logging-out', ({ roomId }) => {
            socket.to(roomId).emit('friend-logged-out', { who: socket.handshake.auth.userId });
            console.log('logging out ', socket.handshake.auth.userId);
        });
        socket.on('send-message', (_a) => {
            var { roomId } = _a, data = __rest(_a, ["roomId"]);
            console.log(data, roomId);
            io.to(roomId).emit('receive-message', data);
        });
        socket.on('disconnect', reason => {
            const id = socket.id;
            const allRooms = socket.rooms;
            console.log({ disconnected: reason });
        });
    });
})();
server.listen(port, () => console.log(`server listening on ${port}`));
