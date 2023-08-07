import express from 'express';
import cors from "cors";
import { nanoid } from "nanoid";
import morgan from "morgan";

const app = express();
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
  })
);
app.get("/", async (req, res) => {
  res.send({ hello: "mom" });
});
app.get("/roomId", async (req, res) => {
  const id = nanoid(10);
  res.status(200).send({ id });
});
export default app;

// "start": "ts-node src/main.ts",
