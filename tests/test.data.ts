import { InternalError, SignupData } from "../src/types";

export const testSignupData: SignupData = {
    "email": "supertest@tester.com",
    "password": "test",
    "firstName": "Test",
    "lastName": "Tester",
    "dob": "2000-01-01",
    "created": "2001-01-01T00:00:00",
    "sequrityQuestions": {
        "firstQuestion": "test1",
        "firstAnswer": "answer1",
        "secondQuestion": "test2",
        "secondAnswer": "answer2"
    },
    "recoveryEmail": "recover@test.com",
    "recoveryPhoneNumber": "1234567890",
    "application": "test",
    "role": "test"
}

export const testInternalError: InternalError = {
    route: "",
    method: "",
    code: null,
    msg: null,
    queryError: null,
    sessionError: null
}