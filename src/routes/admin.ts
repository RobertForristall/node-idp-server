import { Router } from "express";
import { Request, Response } from "express";
import { createBaseInternalError, createQueryInternalError, isAdmin, isAuthenticated } from "../functions";
import { InternalError, RoleData, UpdateRoleData } from "../types";
import db from "../db_conn";
import { ResultSetHeader } from "mysql2";

const adminRouter = Router();

const routeRoot = "/admin"

adminRouter.get("ping", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    res.json("IDP Admin Route Ping Successful!")
})

/**
 * IDP Admin route for getting all roles for an application
 */
adminRouter.get("/roles", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    if (req.query.applicationName) {
        const applicationName: string = req.query.applicationName as string
        const queryStr = `
            select * from Roles where applicationName = '${applicationName}';
        `
        db?.query(queryStr, (err, results, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/roles", "GET", 1, err))
            return res.json(results)
        })
    } else {
        res.status(400).json(createBaseInternalError(routeRoot + "/roles", "GET", 2, "Error: applicationName is null"))
    }
})

/**
 * IDP Admin route for creating new roles for the application that the user is an admin for
 */
adminRouter.post("/roles", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    const newRoleData: RoleData = req.body
    const internalError: InternalError | null = checkRolesPostData(newRoleData, "POST")
    if (internalError != null) res.status(400).json(internalError)
    else {
        const queryStr = `
            insert into Roles (applicationName, roleName, roleDescription)
            values ('${newRoleData.applicationName}', '${newRoleData.roleName}', ${newRoleData.roleDescription ? "'" + newRoleData.roleDescription + "'" : "NULL"});
        `
        db?.query(queryStr, (err, result: ResultSetHeader, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/roles", "POST", 3, err))
            return res.json(result.insertId)
        })
    }
})

/**
 * IDP Admin route for updating existing roles for the application that the user is an admin for
 */
adminRouter.put("/roles", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    const updateRoleData: UpdateRoleData = req.body
    const internalError: InternalError | null = checkRolesPostData(updateRoleData.newRoleData, "PUT")
    if (internalError != null) res.status(400).json(internalError)
    else {
        const queryStr = `
            update Roles set roleName = '${updateRoleData.newRoleData.roleName}', roleDescription = ${updateRoleData.newRoleData.roleDescription ? "'" + updateRoleData.newRoleData.roleDescription + "'" : "NULL"}
            where applicationName = '${updateRoleData.oldApplicationName}' and roleName = '${updateRoleData.oldRoleName}';
        `
        db?.query(queryStr, (err, result, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/roles", "PUT", 3, err))
            return res.json("Role Updated!")
        })
    }
})

/**
 * IDP Admin route for deleting existing roles for the application that the user is an admin for
 */
adminRouter.delete("/roles", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    if (req.query.applicationName && req.query.roleName) {
        const applicationName: string | null = req.query.applicationName as string
        const roleName: string | null = req.query.roleName as string
        const queryStr = `
        delete from Roles where applicationName = '${applicationName}' and roleName = '${roleName}';
        `
        db?.query(queryStr, (err, result, field) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/roles", "DELETE", 1, err))
            return res.json(result)
        })
    } else {
        res.status(400).json(createBaseInternalError(routeRoot + "/roles", "DELETE", 2, `Error: ${req.query.applicationName ? "roleName" : "applicationName"} is missing`))
    }
})

/**
 * IDP Admin route for getting all roles for the application that the user is an admin for and what users have those roles
 */
adminRouter.get("/assigned-roles", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    if (req.query.applicationName) {
        const applicationName: string = req.query.applicationName as string
        const queryStr = `
            select u.id, u.email, r.roleName, r.roleDescription
            from Users u
            inner join AssignedRoles ar 
            on u.id = ar.userId 
            inner join Roles r 
            on ar.roleId = r.id
            where r.applicationName = '${applicationName}';
        `
        db?.query(queryStr, (err, results, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/assigned-roles", "GET", 1, err))
            return res.json(results)
        })
    } else {
        res.status(400).json(createBaseInternalError(routeRoot + "/assigned-roles", "GET", 2, "Error: applicationName is null"))
    }
})

/**
 * IDP Admin route for updating a role assigned to a User
 */
adminRouter.put("/assigned-roles", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    if (req.query.userId && req.query.oldRoleId && req.query.newRoleId) {
        const userId = req.query.userId as string
        const oldRoleId = req.query.oldRoleId as string
        const newRoleId = req.query.newRoleId as string
        const queryStr = `
            update AssignedRoles ar set roleId = ${newRoleId} where ar.userId = ${userId} and ar.roleId = ${oldRoleId};
        `
        db?.query(queryStr, (err, results, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/assigned-roles", "PUT", 1, err))
            return res.json(results)
        })
    } else {
        res.status(400).json(createBaseInternalError(routeRoot + "/assigned-roles", "PUT", 2, `Error: ${req.query.userId == undefined ? "userId" : (req.query.oldRoleId ? "newRoleId" : "oldRoleId")} is missing`))
    }
})

/**
 * IDP Admin route for getting all audit logs recorded by the IDP server for a specific application
 */
adminRouter.get("/audit-logs", isAuthenticated, isAdmin, (req: Request, res: Response) => {
    if (req.query.applicationName) {
        const applicationName: string | null = req.query.applicationName as string
        const queryStr = `
            select * from AuditLogs al
            where al.event = '${applicationName}';
        `
        db?.query(queryStr, (err, results, fields) => {
            if (err) return res.status(400).json(createQueryInternalError(routeRoot + "/audit-logs", "GET", 1, err))
            return res.json(results)
        })
    } else {
        createBaseInternalError(routeRoot + "/audit-logs", "GET", 2, "Error: applicationName is null")
        res.status(400).json(createBaseInternalError(routeRoot + "/audit-logs", "GET", 2, "Error: applicationName is null"))
    }
})

const checkRolesPostData = (roleData: RoleData, method: string): InternalError | null => {
    let missingKey: string | null = null
    let sqlInjectionKey: string | null = null
    Object.entries(roleData).forEach(([key, value]) => {
        if (key != "roleDescription" && missingKey != null && value == null) missingKey = key
        if ((value as string).includes(";")) sqlInjectionKey = key
    })
    if (missingKey) return createBaseInternalError(routeRoot + "/roles", method, 1, `Error: ${missingKey} is null`)
    else if (sqlInjectionKey) return createBaseInternalError(routeRoot + "/roles", method, 2, `Error: ${sqlInjectionKey}'s value contains a semi-colon`)
    return null
}

export default adminRouter