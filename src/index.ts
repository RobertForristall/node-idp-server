import express, { NextFunction } from "express";
import dotenv from "dotenv";
import session from "express-session";
import cors from "cors";
import { User } from "./types";
import idpRouter from "./routes/idp";
const MySQLStore = require("express-mysql-session")(session);

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}

dotenv.config();

const app = express();

app.use(
  cors({
    credentials: true,
    origin:
      process.env.STAGE === "prod"
        ? process.env.PROD_HOST
        : "http://localhost:3000",
  })
);
app.use(express.json());

app.set("trust proxy", 1);
const options = {
  host: process.env.SESSION_STORE_HOST,
  port: process.env.SESSION_STORE_PORT,
  user: process.env.SESSION_STORE_USER,
  password: process.env.SESSION_STORE_PASS,
  database: process.env.SESSION_STORE_DB,
};

const sessionStore = new MySQLStore(options);

sessionStore
  .onReady()
  .then(() => {
    // MySQL session store ready for use.
    console.log("MySQLStore ready");
  })
  .catch((error: any) => {
    // Something went wrong.
    console.error(error);
  });

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET
      ? process.env.EXPRESS_SESSION_SECRET
      : "",
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: { secure: process.env.STAGE === "prod" ? true : false },
  })
);

app.use("/idp", idpRouter)

app.use("/", (req: express.Request, res: express.Response) => {
  console.log(req.url);
  console.log("Auth failed route");
  res.status(401).json("User is not authenticated!");
});

export default app