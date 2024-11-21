import { createTransport } from "nodemailer";
import dotenv from "dotenv";

dotenv.config()

const mailer = createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAILER_EMAIL,
        pass: process.env.MAILER_PASS
    }
})

export default mailer;