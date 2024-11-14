import { createConnection } from "mysql2";

const createNewConnection = () => {
    const db = createConnection({
        host: process.env.DB_URI,
        user: "root",
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
    })
    
    db.connect(err => {
        if (err) throw err;
        console.log("API Database connection established successfully")
    })

    return db
}

export default createNewConnection