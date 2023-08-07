import { instrument } from "@socket.io/admin-ui";
import { Server as SocketServer } from "socket.io";
import type { Socket as ISocket } from "socket.io";
import type { Server } from "http";
import { socketEvents } from "./utils.js";
import { connectToDatabase } from "./libs/db/index.js";
import Room from "./libs/db/room/model.js";

interface SocketWithUserId extends ISocket {
  userId?: string;
}

function transportInit(httpServer: Server) {
  const peers = new SocketServer(httpServer, {
    cors: {
      origin: (_req, callback) => {
        callback(null, true);
      },
      credentials: true,
    },
    transports: ["websocket"],
  });

  instrument(peers, {
    auth: false,
    mode: "development",
  });

  peers.use((socket: SocketWithUserId, next) => {
    const userId = socket.handshake.auth.userId;
    socket.userId = typeof userId === "string" ? userId : "";
    next();
  });

  peers.on("connection", (socket: SocketWithUserId) => {
    console.log(`socket is connected ${socket.id}`);
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
    socket.on(socketEvents.join, (roomId) => {
      console.log("user joined", roomId);
      // join the room
      socket.join(roomId);
      socket.emit(socketEvents.joined, roomId);
      // notify everyone else that you have joined
      socket.to(roomId).emit(socketEvents.friendJoined, {
        whoJoinedId: socket.userId,
        whoJoinedSockId: socket.id,
      });
    });

    //complete don't touch
    socket.on(socketEvents.receive, ({ toWhomId, toWhomSockId, roomId }) => {
      if (toWhomSockId) {
        peers.to(toWhomSockId).emit(socketEvents.receive, {
          fromWhomId: socket.userId,
          fromWhomSockId: socket.id,
        });
      } else {
        (async () => {
          const sockMap = await peers.in(roomId).fetchSockets();
          for (let sock of sockMap) {
            if (sock.handshake.auth.userId === toWhomId) {
              peers.to(sock.id).emit(socketEvents.receive, {
                fromWhomId: socket.userId,
                fromWhomSockId: socket.id,
              });
              break;
            }
          }
        })();
      }
    });

    //complete don't touch
    socket.on(
      socketEvents.sendSignal,
      ({ toWhomId, toWhomSockId, signal, roomId }) => {
        if (toWhomSockId) {
          peers.to(toWhomSockId).emit(socketEvents.receiveSignal, {
            fromWhomId: socket.userId,
            fromWhomSockId: socket.id,
            signal,
          });
        } else {
          (async () => {
            const sockMap = await peers.in(roomId).fetchSockets();
            for (let sock of sockMap) {
              if (sock.handshake.auth.userId === toWhomId) {
                peers.to(sock.id).emit(socketEvents.receiveSignal, {
                  fromWhomId: socket.userId,
                  fromWhomSockId: socket.id,
                  signal,
                });
                break;
              }
            }
          })();
        }
      }
    );

    // ask for permission
    socket.on(socketEvents.askPermission, async ({ roomId }) => {
      await connectToDatabase();
      const user = await Room.findOne({
        roomId,
      })
        .select("authorId")
        .lean();
      console.log(user, " from socket ");

      const sockets = await peers.in(roomId).fetchSockets();
      console.log(sockets, " sockets ");
      const authorSocket = sockets.find((sock) => {
        const state =
          (sock as unknown as { userId: string }).userId ===
          (user as unknown as { authorId: string }).authorId;
        return state;
      });
      if (authorSocket) {
        console.log(" autorSocketid ", authorSocket.id);
        peers.to(authorSocket.id).emit(socketEvents.grantPermission, {
          socketId: socket.id,
          userId: (socket as unknown as { userId: string }).userId,
        });
      }
    });

    socket.on(
      socketEvents.permissionGranted,
      ({ socketId, userId, roomId }) => {
        console.log(" permission has been given to you ");
        (async () => {
          try {
            await Room.updateOne(
              { roomId },
              { $addToSet: { members: userId } }
            );
            peers.to(socketId).emit(socketEvents.permissionGranted, {});
          } catch (e) {
            throw e;
          }
        })();
      }
    );

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

    console.log("I am connected and working", socket.handshake.auth.userId);

    // logging out events
    socket.on(socketEvents.logggingOut, ({ roomId }) => {
      socket
        .to(roomId)
        .emit(socketEvents.friendLogout, { who: socket.handshake.auth.userId });
      console.log("logging out ", socket.handshake.auth.userId);
    });

    socket.on("send-message", ({ roomId, ...data }) => {
      console.log(data, roomId);
      peers.to(roomId).emit("receive-message", data);
    });

    socket.on("disconnect", (reason) => {
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
}

export default transportInit;
