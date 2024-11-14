/**
 * Interface for defining user data returned by the session store
 */
export interface User {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    id_token: string;
}

/**
 * Interface for defining signup data
 */
export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    dob: Date;
    created: Date;
    sequrityQuestions: SequrityQuestion;
    recoveryEmail: string | null;
    recoveryPhoneNumber: string | null;
    application: string;
    role: string;
}

/**
 * Interface for defining sequrity questions used to recover a user's account
 */
export interface SequrityQuestion {
    firstQuestion: string;
    firstAnswer: string;
    secondQuestion: string;
    secondAnswer: string;
    created: Date;
    modified: Date;
}