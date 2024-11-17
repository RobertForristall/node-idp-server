import { Router } from "express";
import { isAuthenticated, verifyEmail } from "../functions";
import { Request, Response } from "express";
import session, { Store } from "express-session";
import { InternalError, SignupData } from "../types";
import db from "../db_conn";
import { recoveryEmailsTableCols, recoveryPhoneNumberTableCols, recoveryResourcesTableCols, securityQuestionsTableCols, usersTableCols } from "../constants";
import { ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";
import { differenceInYears, parse } from "date-fns";

const idpRouter = Router();

/**
 * Un-Authorized Route: Ping the server to check for connectivity
 */
idpRouter.get("/ping", (req: Request, res: Response) => {
    res.json("Ping Successful!")
});

/**
 * Un-Authorized Route: Signup new user
 */
idpRouter.post("/signup", (req: Request, res: Response) => {

    // Parse request body into typed object
    const signupData: SignupData = req.body

    // Variable for checking if at least one recovery resource is provided
    let recoveryResourceProvided = false;

    let missingRequiredValue: string | null = null

    let sqlInjectionDetected = false

    Object.entries(signupData).forEach(([key, value]) => {
        // Check that at least one recovery resource is provided
        if ((key == "recoveryEmail" && value != null) || (key == "recoveryPhoneNumber" && value != null)) recoveryResourceProvided = true
        else {
            // If a required value is null then return an error
            if (value == null && key != "recoveryEmail" && key != "recoveryPhoneNumber" && missingRequiredValue == null) missingRequiredValue = key
            // If any strings contain a semi-colon return an error since it may be an SQL injection attempt
            if (typeof value == "string" && value.includes(";")) sqlInjectionDetected = true
        }
    })
    let internalError: InternalError = {route: "/idp/signup", code: null, msg: null, queryError: null}
    if (missingRequiredValue != null) internalError = {...internalError, code: 1, msg: `Error: ${missingRequiredValue} should not be null.`}
    else if (sqlInjectionDetected) internalError = {...internalError, code: 2, msg: "Error: String value contains semi-colon"}
    // If no recovery resources are provided then return an error
    else if (!recoveryResourceProvided) internalError = {...internalError, code: 3, msg: `Error: At least one of the following must be provided: Recovery Email, Recovery Phone Number`}
    // If the provided email is not in a valid format then return an error
    else if (!verifyEmail(signupData.email)) internalError = {...internalError, code: 4, msg: "Error: email is not in a valid format"}
    // If the user is not old enough (18+) return an error
    else if (differenceInYears(new Date(), parse(signupData.dob, "yyyy-MM-dd", new Date())) < 18) internalError = {...internalError, code: 5, msg: "Error: User is not 18+ years of age"}
    
    if (internalError.code != null) {
        res.status(400).json(internalError)
    } else {
        // Create the query to insert the user data
        const userInsertQuery = `
        insert into Users (${usersTableCols.join(", ")})
        values ('${signupData.email}', '${signupData.password}', false, '${signupData.firstName}', '${signupData.lastName}', '${signupData.dob}', '${signupData.created}', '${signupData.created}');
        `
        db?.query(userInsertQuery, async (err, result: ResultSetHeader, field) => {
            if (err) {
                return res.status(400).json({...internalError, code: 6, queryError: err})
            }
            // Parse database id for user from response to be used in subsequent queries
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

            db?.query(verificationQuery, (err, verificationResult: ResultSetHeader, verificationField) => {
                if (err) return res.status(400).json({...internalError, code: 6, queryError: err})
                db?.query(securityQuestionQuery, (err, securityQuestionResult: ResultSetHeader, securityQuestionField) => {
                    if (err) return res.status(400).json({...internalError, code: 6, queryError: err})
                    securityQuestionId = securityQuestionResult.insertId
                    db?.query(recoveryEmailQuery, (err, recoveryEmailResult: ResultSetHeader, recoveryEmailField) => {
                        if (err) return res.status(400).json({...internalError, code: 6, queryError: err})
                        recoveryEmailId = recoveryEmailResult.insertId
                        db?.query(recoveryPhoneNumberQuery, (err, recoveryPhoneNumberResult: ResultSetHeader, recoveryPhoneNumberField) => {
                            if (err) return res.status(400).json({...internalError, code: 6, queryError: err})
                            recoveryPhoneNumberId = recoveryPhoneNumberResult.insertId
                            const recoveryResourcesQuery = `
                            insert into RecoveryResources (${recoveryResourcesTableCols.join(", ")})
                            values (${userId}, ${securityQuestionId}, ${recoveryEmailId}, ${recoveryPhoneNumberId});
                            `
                            db?.query(recoveryResourcesQuery, (err, recoveryResourcesResult, recoveryResourcesField) => {
                                if (err) return res.status(400).json({...internalError, code: 6, queryError: err})
                                res.json("Signup Complete!")
                                
                            })
                        })
                    })
                })
            })
        })
    }
    
})

export default idpRouter;