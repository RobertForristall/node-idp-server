import express from "express";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
import validator from "validator";
import mailer from "./mailer";
import dotenv from "dotenv";

dotenv.config()

export function isAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log("Auth Check Route");
  req.sessionStore.get(req.sessionID, (err, session) => {
    if (err) {
      res.status(401).json(err);
    } else if (session?.user) {
      next();
    } else {
      res.status(401).json("No active session; Redirect to login.");
    }
  });
}

export function isAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log("Is Admin Check Route");
  req.sessionStore.get(req.sessionID, (err, session) => {
    if (err) {
      res.status(403).json(err)
    } else if (session?.user.application == "IDP" && session?.user.role == "Admin") {
      next();
    } else {
      res.status(403).json("User does not have the authorization to access this route.")
    }
  })
}

export function verifyEmail(email: string) {
  return validator.isEmail(email)
}

export function generateAuditLogInsertQuery(userId: number, event: string, action: string, status: string) {
  return `
  insert into AuditLogs (userId, event, action, status, created)
  values (${userId}, '${event}', '${action}', '${status}', CURRENT_TIMESTAMP())
  `
}

export function sendVerificationEmail(email: string, verificationToken: string) {
  const mailOptions: MailOptions = {
    from: process.env.MAILER_EMAIL,
    to: email,
    subject: "Verification email from Forristall IDP Services",
    html: `
      
    `
  }
}