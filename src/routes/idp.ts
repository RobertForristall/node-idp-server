import { Router } from "express";
import { isAuthenticated } from "../functions";
import { Request, Response } from "express";
import session, { Store } from "express-session";
import { SignupData } from "../types";
import db from "../db_conn";
import { usersTableCols } from "../constants";

const idpRouter = Router();

idpRouter.get("/ping", (req: Request, res: Response) => {
    res.json("Ping Successful!")
});

idpRouter.post("/signup", (req: Request, res: Response) => {
    const signupData: SignupData = req.body
    /**
     * TODO check all signup data to ensure it is acceptable:
     * - All required fields should be non-null values and at least one recovery resource should be provided
     * - email should be valid
     * - dob should show the user is at least 18+
     */
    const currentDate = new Date()
    const currentDateStr = currentDate.toDateString()+"T"+currentDate.toTimeString()
    const query = `
        insert into Users (${usersTableCols.join(", ")})
        values ('${signupData.email}', '${signupData.password}', false, '${signupData.firstName}', '${signupData.lastName}', '${signupData.dob.toDateString()}', '${currentDateStr}', '${currentDateStr}');
    `

    
})

export default idpRouter;