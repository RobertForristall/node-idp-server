import { Server } from "http"
import app from "../src/index"
import request from "supertest"
import TestAgent from "supertest/lib/agent"
import { testSignupData } from "./test.data"

let server: Server | null = null
let myRequest: InstanceType<typeof TestAgent> | null = null

beforeAll((done) => {
    server = app.listen(done)
    myRequest = request.agent(server)
})

afterAll((done) => {
    server?.close(done)
})

describe("GET /idp/ping", () => {

    // let server: Server | null = null
    // let myRequest: InstanceType<typeof TestAgent> | null = null

    // beforeAll((done) => {
    //     server = app.listen(done)
    //     myRequest = request.agent(server)
    // })

    // afterAll((done) => {
    //     server?.close(done)
    // })

    it("Should return 200", (done) => {
        myRequest?.get("/idp/ping")
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                return done()
            })
    })
})

describe("POST /idp/signup", () => {
    it("Should successfully sign up the user", (done) => {
        myRequest?.post("/idp/signup")
        .send(testSignupData)
        .expect(200)
        .end((err, res) => {
            if (err) done(err)
            return done()
        })
    })
})