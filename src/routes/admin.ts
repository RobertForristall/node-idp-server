import { Router } from "express";
import { Request, Response } from "express";
import { isAdmin, isAuthenticated } from "../functions";

const adminRouter = Router();

adminRouter.get("ping", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    res.json("IDP Admin Route Ping Successful!")
})

export default adminRouter