import { Server } from "http"
import app from "../src/index"
import request from "supertest"
import TestAgent from "supertest/lib/agent"
import { testInternalError, testSignupData } from "./test.data"
import {InternalError, SignupData} from "../src/types"
import db from "../src/db_conn"

let server: Server | null = null
let myRequest: InstanceType<typeof TestAgent> | null = null

beforeAll((done) => {
    server = app.listen(done)
    myRequest = request.agent(server)
    let waitForDbConnection = true
    setTimeout(() => {
        waitForDbConnection = false
    }, 10000)
    while (waitForDbConnection && db == null) {
        
    }
})

afterAll((done) => {
    server?.close(done)
    done()
})

describe("GET /idp/ping", () => {

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
            if (err) return done(err)
            return done()
        })
    })

    it("Should error if a required property is null", (done) => {
        myRequest?.post("/idp/signup")
        .send({...testSignupData, password: null})
        .expect(400)
        .end((err, res) => {
            if (err) return done(err)
            expect((res.body as InternalError).route).toBe("/idp/signup")
            expect((res.body as InternalError).code).toBe(1)
            expect((res.body as InternalError).msg).toBe("Error: password should not be null.")
            expect((res.body as InternalError).queryError).toBe(null)
            return done()
        })
    })

    it("Should error if a semi-colon is included", (done) => {
        myRequest?.post("/idp/signup")
        .send({...testSignupData, firstName: "robert;"})
        .expect(400)
        .end((err, res) => {
            if (err) return done(err)
            expect((res.body as InternalError).route).toBe("/idp/signup")
            expect((res.body as InternalError).code).toBe(2)
            expect((res.body as InternalError).msg).toBe("Error: String value contains semi-colon")
            expect((res.body as InternalError).queryError).toBe(null)
            return done()
        })
    })

    it("Should error if no recovery resources are provided", (done) => {
        myRequest?.post("/idp/signup")
        .send({...testSignupData, recoveryEmail: null, recoveryPhoneNumber: null})
        .expect(400)
        .end((err, res) => {
            if (err) return done(err)
            expect((res.body as InternalError).route).toBe("/idp/signup")
            expect((res.body as InternalError).code).toBe(3)
            expect((res.body as InternalError).msg).toBe("Error: At least one of the following must be provided: Recovery Email, Recovery Phone Number")
            expect((res.body as InternalError).queryError).toBe(null)
            return done()
        })
    })

    it("Should error if no recovery resources are provided", (done) => {
        myRequest?.post("/idp/signup")
        .send({...testSignupData, email: "robertf.com"})
        .expect(400)
        .end((err, res) => {
            if (err) return done(err)
            expect((res.body as InternalError).route).toBe("/idp/signup")
            expect((res.body as InternalError).code).toBe(4)
            expect((res.body as InternalError).msg).toBe("Error: email is not in a valid format")
            expect((res.body as InternalError).queryError).toBe(null)
            return done()
        })
    })

    it("Should error if no recovery resources are provided", (done) => {
        myRequest?.post("/idp/signup")
        .send({...testSignupData, dob: "2010-01-01"})
        .expect(400)
        .end((err, res) => {
            if (err) return done(err)
            expect((res.body as InternalError).route).toBe("/idp/signup")
            expect((res.body as InternalError).code).toBe(5)
            expect((res.body as InternalError).msg).toBe("Error: User is not 18+ years of age")
            expect((res.body as InternalError).queryError).toBe(null)
            return done()
        })
    })

})