import express from "express";
import validator from "validator";

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

export function verifyEmail(email: string) {
  return validator.isEmail(email)
}