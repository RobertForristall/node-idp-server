import { Router } from "express";
import { generateAuditLogInsertQuery, sendVerificationEmail, verifyEmail, sendRecoveryEmail, createBaseInternalError, createQueryInternalError, createSessionInternalError } from "../functions";
import { Request, Response } from "express";
import { InternalError, LoginData, RecoveryData, SignupData } from "../types";
import db from "../db_conn";
import { recoveryEmailsTableCols, recoveryPhoneNumberTableCols, recoveryResourcesTableCols, securityQuestionsTableCols, usersTableCols } from "../constants";
import { ResultSetHeader } from "mysql2";
import { randomUUID } from "crypto";
import { differenceInYears, parse } from "date-fns";

const idpRouter = Router();

const routeRoot = "/idp"

/**
 * Un-Authorized Route: Ping the server to check for connectivity
 */
idpRouter.get("/ping", (req: Request, res: Response) => {
    res.json("IDP Main Route Ping Successful!")
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
    let internalError: InternalError | null = null
    if (missingRequiredValue != null) internalError = createBaseInternalError(routeRoot + "/signup", "POST", 1, `Error: ${missingRequiredValue} should not be null.`)
    else if (sqlInjectionDetected) internalError = createBaseInternalError(routeRoot + "/signup", "POST", 2, "Error: String value contains semi-colon")
    // If no recovery resources are provided then return an error
    else if (!recoveryResourceProvided) internalError = createBaseInternalError(routeRoot + "/signup", "POST", 3, `Error: At least one of the following must be provided: Recovery Email, Recovery Phone Number`)
    // If the provided email is not in a valid format then return an error
    else if (!verifyEmail(signupData.email)) internalError = createBaseInternalError(routeRoot + "/signup", "POST", 4, "Error: email is not in a valid format")
    // If the user is not old enough (18+) return an error
    else if (differenceInYears(new Date(), parse(signupData.dob, "yyyy-MM-dd", new Date())) < 18) internalError = createBaseInternalError(routeRoot + "/signup", "POST", 5, "Error: User is not 18+ years of age")
    //TODO ensure admins can not be made from this route
    //TODO handle removing inserted rows in case of a query error
    //TODO handle missing recovery resource
    
    if (internalError != null) {
        res.status(400).json(internalError)
    } else {
        // Create the query to insert the user data
        const userInsertQuery = `
        insert into Users (${usersTableCols.join(", ")})
        values ('${signupData.email}', '${signupData.password}', false, '${signupData.firstName}', '${signupData.lastName}', '${signupData.dob}', '${signupData.created}', '${signupData.created}');
        `
        db?.query(userInsertQuery, async (err, result: ResultSetHeader, field) => {
            if (err) {
                return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))

            }
            // Parse database id for user from response to be used in subsequent queries
            const userId = result.insertId
            var securityQuestionId: number | null
            var recoveryEmailId: number | null
            var recoveryPhoneNumberId: number | null
            const verificationToken = randomUUID();
            const verificationQuery = `
                insert into Verification (userId, verificationToken)
                values (${userId}, '${verificationToken}');
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
            const roleQuery = `
            select id from Roles where applicationName = '${signupData.application}' and roleName = '${signupData.role}';
            `
            const auditLogQuery = generateAuditLogInsertQuery(userId, "IDP", "Signup", "Success")

            db?.query(verificationQuery, (err, verificationResult: ResultSetHeader, verificationField) => {
                if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                db?.query(securityQuestionQuery, (err, securityQuestionResult: ResultSetHeader, securityQuestionField) => {
                    if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                    securityQuestionId = securityQuestionResult.insertId
                    db?.query(recoveryEmailQuery, (err, recoveryEmailResult: ResultSetHeader, recoveryEmailField) => {
                        if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                        recoveryEmailId = recoveryEmailResult.insertId
                        db?.query(recoveryPhoneNumberQuery, (err, recoveryPhoneNumberResult: ResultSetHeader, recoveryPhoneNumberField) => {
                            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                            recoveryPhoneNumberId = recoveryPhoneNumberResult.insertId
                            const recoveryResourcesQuery = `
                            insert into RecoveryResources (${recoveryResourcesTableCols.join(", ")})
                            values (${userId}, ${securityQuestionId}, ${recoveryEmailId}, ${recoveryPhoneNumberId});
                            `
                            db?.query(recoveryResourcesQuery, (err, recoveryResourcesResult, recoveryResourcesField) => {
                                if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                                db?.query(roleQuery, (err, roleResult, roleFields) => {
                                    if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                                    const roleResultArray = roleResult as Array<{id: number}>
                                    if (roleResultArray.length != 1) return res.status(400).json(createBaseInternalError(routeRoot + "/signup", "POST", 5, "Assigned role not found..."))
                                    const roleId = roleResultArray[0].id
                                    const assignedRoleQuery = `
                                    insert into AssignedRoles (userId, roleId)
                                    values (${userId}, ${roleId})
                                    `
                                    db?.query(assignedRoleQuery, (err, result, fields) => {
                                        if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                                        db?.query(auditLogQuery, (err, auditLogResult, fields) => {
                                            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/signup", "POST", 6, err))
                                            sendVerificationEmail(signupData.email, userId, verificationToken)
                                            res.json("Signup Complete!")
                                        })
                                    })
                                })
                            })
                        })
                    })
                })
            })
        })
    }
    
})

idpRouter.post("/login", (req: Request, res: Response) => {
    const loginData: LoginData = req.body

    let missingRequiredValue: string | null = null

    let sqlInjectionDetected = false

    Object.entries(loginData).forEach(([key, value]) => {
        // If a required value is null then return an error
        if (value == null && missingRequiredValue == null) missingRequiredValue = key
        // If any strings contain a semi-colon return an error since it may be an SQL injection attempt
        if (typeof value == "string" && value.includes(";")) sqlInjectionDetected = true
    })

    let internalError: InternalError | null = null

    if (missingRequiredValue != null) internalError = createBaseInternalError(routeRoot + "/login", "POST", 1, `Error: ${missingRequiredValue} should not be null.`)
    else if (sqlInjectionDetected) internalError = createBaseInternalError(routeRoot + "/login", "POST", 2, "Error: String value contains semi-colon")
    else if (!verifyEmail(loginData.email)) internalError = createBaseInternalError(routeRoot + "/login", "POST", 3, "Error: email is not in a valid format")

    if (internalError != null) {
        res.status(400).json(internalError)
    } else {
        const queryString = `
            select u.id, u.verified, r.roleName 
            from Users u
            inner join AssignedRoles ar 
            on u.id = ar.userId 
            inner join Roles r 
            on ar.roleId = r.id 
            where u.email = '${loginData.email}' and u.password = '${loginData.password}' and r.applicationName = '${loginData.applicationName}'; 
        `
        db?.query(queryString, (err, result, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/login", "POST", 4, err))
            const resultArray = result as Array<{id: number, verified: boolean, roleName: string}>
            if (resultArray.length != 1) return res.status(400).json(createBaseInternalError(routeRoot + "/login", "POST", 5, "No users found..."))
            if (!resultArray[0].verified) return res.status(400).json(createBaseInternalError(routeRoot + "/login", "POST", 6, "User is not verified..."))
            req.session.regenerate((err) => {
                if (err) return res.status(400).json(createSessionInternalError(routeRoot + "/login", "POST", 7, err))
                const userId = resultArray[0].id
                req.session.user = {email: loginData.email, userId: userId, application: loginData.applicationName, role: resultArray[0].roleName}
                db?.query(generateAuditLogInsertQuery(userId, "IDP", "Login", "Success"), (err, auditLogResult, fields) => {
                    if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/login", "POST", 4, err))
                })
                res.json("Login Successful!")
            })
        })
    }
})

idpRouter.get("/verify", (req: Request, res: Response) => {
    const userId = req.query.userId
    const verificationToken = req.query.verificationToken
    if (verificationToken && userId) {
        const queryStr = `update Users set verified = true where id = (select userId from Verification where verificationToken = '${verificationToken}' and userId = ${userId});`
        db?.query(queryStr, (err, result: ResultSetHeader, fields) => {
            console.log(err)
            console.log(result)
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/verify", "GET", 2, err))
            if (result.affectedRows != 1) return res.status(400).json(createBaseInternalError(routeRoot + "/verify", "GET", 3, "Error: no match for provided userId and verificationToken"))
            return res.json("User Verified!")
        })
    } else {
        res.status(400).json(createBaseInternalError(routeRoot + "/verify", "GET", 1, `Error: ${verificationToken ? "userId" : "verificationToken"} is missing`))
    }
})

idpRouter.post("/forgot", (req: Request, res: Response) => {
    const recoveryData: RecoveryData = req.body
    const recoveryCode = randomUUID()
    //TODO handle errors
    if (recoveryData.phone) {
        // TODO Handle phone resource based account recovery
    } else {
        const queryStr = `
            insert into EmailRecoveryCode (userId, code) values (${recoveryData.userId}, '${recoveryCode}');
        `
        db?.query(queryStr, (err, results, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/forgot", "POST", 1, err))
            sendRecoveryEmail(recoveryData.email, recoveryData.userId, recoveryCode)
        })
    }
})

idpRouter.get("/recover", (req: Request, res: Response) => {

})

export default idpRouter;