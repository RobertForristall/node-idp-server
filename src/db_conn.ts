import { createConnection } from "mysql";

const db = createConnection({
    host: process.env.DB_URI,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
})

db.connect(err => {
    if (err) throw err;
    console.log("API Database connection established successfully")
})

export default db