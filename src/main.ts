import "dotenv/config.js";
import { Server as SocketServer } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

import { createServer } from "http";
import app from "./app.js";
import { connectToDatabase } from "./libs/db/index.js";
import Room from "./libs/db/room/model.js";

import transportInit from "./transport.js";

const port = Number(process.env.PORT || 8000);

const httpServer = createServer(app);

transportInit(httpServer);

httpServer.listen(port, () => console.log(`server listening on ${port}`));
