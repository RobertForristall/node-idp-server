import { Router } from "express";
import { isAuthenticated } from "../functions";
import { Request, Response } from "express";
import session, { Store } from "express-session";

const idpRouter = Router();

idpRouter.get("/ping", (req: Request, res: Response) => {
    res.json("Ping Successful!")
});

idpRouter.post("/signup", (req: Request, res: Response) => {

})

export default idpRouter;