import { Server } from "http"
import app from "../src/index"
import request from "supertest"
import TestAgent from "supertest/lib/agent"
import { testInternalError, testLoginData, testSignupData } from "./test.data"
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
    db?.query("insert into Roles (applicationName, roleName, roleDescription) values ('test', 'test', '');", (err, results, fields) => {
        if (err) return done(err)
    })
    done()
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
            expect((res.body as InternalError).queryError).toBe(undefined)
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
            expect((res.body as InternalError).queryError).toBe(undefined)
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
            expect((res.body as InternalError).queryError).toBe(undefined)
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
            expect((res.body as InternalError).queryError).toBe(undefined)
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
            expect((res.body as InternalError).queryError).toBe(undefined)
            return done()
        })
    })

})

describe("GET /idp/verify", () => {
    let verificationToken: string | null = null
    let testUserId: number | null = null

    beforeAll((done) => {
        const queryStr = `
            select u.id, v.verificationToken
            from Users u
            inner join Verification v
            on u.id = v.userId
            where u.email = '${testSignupData.email}';
        `
        db?.query(queryStr, (err, results, fields) => {
            if (err) return done(err)
            const resultArray = results as Array<{id: number, verificationToken: string}>
            testUserId = resultArray[0].id
            verificationToken = resultArray[0].verificationToken
            return done()
        })
    })

    it("Should verify the test user successfully", (done) => {
        myRequest?.get("/idp/verify")
            .query({userId: testUserId, verificationToken: verificationToken})
            .send()
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                expect(res.body).toBe("User Verified!")
                return done()
            })
    })
})

describe("POST /idp/login", () => {

    it("Should login the user and return a cookie for the session", (done) => {
        myRequest?.post("/idp/login")
            .send(testLoginData)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err)
                // TODO check for cookie
                return done()
            })
    })
})