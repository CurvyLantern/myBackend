import { Server } from 'socket.io';
import { server } from './app.js';
import { instrument } from '@socket.io/admin-ui';
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});
instrument(io, {
    auth: false,
    mode: 'development',
});
export default io;
//# sourceMappingURL=socket.js.map