import { Connection, createConnection } from "mysql2";
import {MySqlContainer, StartedMySqlContainer} from "@testcontainers/mysql"
import { readFile } from "fs/promises";
import dotenv from "dotenv";

const createTestContainer = async () => {
   return await new MySqlContainer().start()
}

const prepareTestContainerDatabase = async (startedContainer: StartedMySqlContainer) => {
    const query = await readFile("../tests/database_sql.sql", 'utf-8')
    await startedContainer.executeQuery(query)
}

let db: Connection | null = null

console.log(`Current ENV: ${process.env.NODE_ENV}`)

if (process.env.NODE_ENV == "test-w-container") {
    console.log("Creating test container...")
    createTestContainer().then(async (startedContainer) => {
        console.log("Testcontainer created, preparing database...")
        await prepareTestContainerDatabase(startedContainer)

        console.log("Contianer database prepared, creating connection...")
        const connection = createConnection({
            host: startedContainer.getHost(),
            user: startedContainer.getUsername(),
            password: startedContainer.getUserPassword(),
            database: startedContainer.getDatabase(),
        })

        connection.connect(err => {
            if (err) throw err;
            console.log("Test API Database connection established successfully")
        })

        db = connection
    })
    .catch((err) => {
        //TODO handle failed test container creation
    })
} else {
    dotenv.config()
    console.log("Creating API Database connection...")
    db = createConnection({
        host: process.env.DB_URI,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
    })

    db.connect(err => {
        if (err) throw err;
        console.log("API Database connection established successfully")
    })
}

export default db