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

export function sendVerificationEmail(email: string, userId: number,  verificationToken: string) {
  const verificationLink = (process.env.SSL ? "https" : "http") + "://" + process.env.HOST + ":" + process.env.PORT + "/idp/verify?userId=" + userId + "&verificationToken=" + verificationToken
  const mailOptions: MailOptions = {
    from: process.env.MAILER_EMAIL,
    to: email,
    subject: "Verification email from Forristall IDP Services",
    html: `
      <div>
        <h1>Forristall IDP User Verification</h1>
        <p>Please click the following link to verify the user: ${verificationLink}</p>
      </div>
    `
  }
  console.log(mailOptions)
  mailer.sendMail(mailOptions)
}

export function sendRecoveryEmail(email: string, userId: number,  verificationToken: string) {
  const verificationLink = (process.env.SSL ? "https" : "http") + "://" + process.env.HOST + ":" + process.env.PORT + "/idp/recover?userId=" + userId + "&verificationToken=" + verificationToken
  const mailOptions: MailOptions = {
    from: process.env.MAILER_EMAIL,
    to: email,
    subject: "Recovery email from Forristall IDP Services",
    html: `
      <div>
        <h1>Forristall IDP User Recovery</h1>
        <p>Please click the following link to recover the user and set a new password: ${verificationLink}</p>
        <p>If this was not requested by you then please disregard this email.</p>
      </div>
    `
  }
  console.log(mailOptions)
  mailer.sendMail(mailOptions)
}