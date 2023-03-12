import express from 'express';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
export { app, server };

// "start": "ts-node src/main.ts",
