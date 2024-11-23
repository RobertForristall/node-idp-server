import { createTransport } from "nodemailer";
import dotenv from "dotenv";
import * as aws from '@aws-sdk/client-ses'

dotenv.config()

//@ts-expect-error shouldnt error
const ses = new aws.SES({
    apiVersion: "2010-12-01",
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const mailer = createTransport({
    SES: { ses, aws }
})

export default mailer;