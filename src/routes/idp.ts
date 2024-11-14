import { Router } from "express";
import { isAuthenticated } from "../functions";
import { Request, Response } from "express";
import session, { Store } from "express-session";
import { SignupData } from "../types";
import createNewConnection from "../db_conn";
import { recoveryEmailsTableCols, recoveryPhoneNumberTableCols, recoveryResourcesTableCols, securityQuestionsTableCols, usersTableCols } from "../constants";
import { ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";

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
    // const currentDate = new Date()
    // const currentDateStr = currentDate.toDateString()+"T"+currentDate.toTimeString()
    const userInsertQuery = `
        insert into Users (${usersTableCols.join(", ")})
        values ('${signupData.email}', '${signupData.password}', false, '${signupData.firstName}', '${signupData.lastName}', '${signupData.dob}', '${signupData.created}', '${signupData.created}');
    `
    const db = createNewConnection()
    db.query(userInsertQuery, async (err, result: ResultSetHeader, field) => {
        if (err) {
            db.end()
            return res.status(400).json(err)
        }
        const userId = result.insertId
        var securityQuestionId: number | null
        var recoveryEmailId: number | null
        var recoveryPhoneNumberId: number | null
        const verificationQuery = `
            insert into Verification (userId, verificationToken)
            values (${userId}, '${randomUUID()}');
        `
        const securityQuestionQuery = `
            insert into SecurityQuestions (${securityQuestionsTableCols.join(", ")})
            values ('${signupData.sequrityQuestions.firstQuestion}', '${signupData.sequrityQuestions.firstAnswer}', '${signupData.sequrityQuestions.secondQuestion}', '${signupData.sequrityQuestions.secondAnswer}', '${signupData.created}', '${signupData.created}');
        `
        const recoveryEmailQuery = `
            insert into RecoveryEmails (${recoveryEmailsTableCols.join(", ")})
            values ('${signupData.recoveryEmail}', false, '${signupData.created}', '${signupData.created}');
        `
        const recoveryPhoneNumberQuery = `
            insert into RecoveryPhoneNumbers (${recoveryPhoneNumberTableCols.join(", ")})
            values ('${signupData.recoveryPhoneNumber}', false, '${signupData.created}', '${signupData.created}');
        `

        db.query(verificationQuery, (err, verificationResult: ResultSetHeader, verificationField) => {
            if (err) {
                db.end()
                return res.status(400).json(err)
            }
            db.query(securityQuestionQuery, (err, securityQuestionResult: ResultSetHeader, securityQuestionField) => {
                if (err) {
                    db.end()
                    return res.status(400).json(err)
                }
                securityQuestionId = securityQuestionResult.insertId
                db.query(recoveryEmailQuery, (err, recoveryEmailResult: ResultSetHeader, recoveryEmailField) => {
                    if (err) {
                        db.end()
                        return res.status(400).json(err)
                    }
                    recoveryEmailId = recoveryEmailResult.insertId
                    db.query(recoveryPhoneNumberQuery, (err, recoveryPhoneNumberResult: ResultSetHeader, recoveryPhoneNumberField) => {
                        if (err) {
                            db.end()
                            return res.status(400).json(err)
                        }
                        recoveryPhoneNumberId = recoveryPhoneNumberResult.insertId
                        const recoveryResourcesQuery = `
                        insert into RecoveryResources (${recoveryResourcesTableCols.join(", ")})
                        values (${userId}, ${securityQuestionId}, ${recoveryEmailId}, ${recoveryPhoneNumberId});
                        `
                        db.query(recoveryResourcesQuery, (err, recoveryResourcesResult, recoveryResourcesField) => {
                            if (err) {
                                db.end()
                                return res.status(400).json(err)
                            }
                            res.json("Signup Complete!")
                            db.end()
                        })
                    })
                })
            })
        })
    })
})

export default idpRouter;