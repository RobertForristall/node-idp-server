export const usersTableCols = [
    "email",
    "password",
    "verified",
    "firstName",
    "lastName",
    "dob",
    "created",
    "modified"
]

export const securityQuestionsTableCols = [
    "firstQuestion",
    "firstAnswer",
    "secondQuestion",
    "secondAnswer",
    "created",
    "modified"
]

export const recoveryEmailsTableCols = [
    "email",
    "verified",
    "created",
    "modified"
]

export const recoveryPhoneNumberTableCols = [
    "phoneNumber",
    "verified",
    "created",
    "modified"
]

export const recoveryResourcesTableCols = [
    "userId",
    "questionsResourceId",
    "emailResourceId",
    "phoneResourceId"
]

export const auditLogsTableCols = [
    "userId",
    "event",
    "action",
    "status",
    "created"
]

export const rolesTableCols = [
    "applicationName",
    "roleName",
    "roleDescription"
]

export const assignedRolesTableCols = [
    "userId",
    "roleId"
]