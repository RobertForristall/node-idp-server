-- Database for containing Identity Provider Information for services that I develop
-- Author Robert Forristall (robert.s.forristall@gmail.com)

-- Create and use the database
create database Idp;
use Idp;

/*
    Users: Contains Information on a created user managed by the IDP server

    Properties:
    - email: Email address provided by the user which will be used for authentication and verification
    - password: Encrypted password provided by the user for authentication
    - verified: If the user has verified the provided email address
    - firstName: First name of the user
    - lastName: Last name of the user
    - dob: Date of birth for the user to ensure they are old enough to utilize services'
    - created: When the user first signed up with the server
    - modified: When the last modification was made to the resource

    Keys:
    - Primary Key: id
*/
create table Users (
    id int not null auto_increment,
    email varchar(100) not null unique,
    password varchar(50) not null,
    verified boolean not null,
    firstName varchar(50) not null,
    lastName varchar(50) not null,
    dob date not null,
    created timestamp not null,
    modified timestamp not null,
    primary key (id)
);

/*
    Security Questions: Security questions that the user can use to recover their information

    Properties:
    - firstQuestion: First security question decided on by the user
    - firstAnswer: Answer to the security question in the "firstQuestion" property
    - secondQuestion: Second security question decided on by the user
    - secondAnswer: Answer to the security question in the "secondQuestion" property
    - created: When this resource was first created
    - modified: When this resource was last modified

    Keys:
    - Primary Key: id
*/
create table SecurityQuestions (
    id int not null auto_increment,
    firstQuestion varchar(100) not null,
    firstAnswer varchar(100) not null,
    secondQuestion varchar(100) not null,
    secondAnswer varchar(100) not null,
    created timestamp not null,
    modified timestamp not null,
    primary key (id)
);

/*
    Recovery Emails: Emails that are registered by users for the purpose of recovery in the case that
                     their main email becomes in-accessable

    Properties:
    - email: User specified email to be used only for the recovery of the account
    - verified: If the resource has been verified by the user
    - created: When this resource was first created
    - modified: When this resource was last modified

    Keys:
    - Primary Key: id
*/
create table RecoveryEmails (
    id int not null auto_increment,
    email varchar(100) not null,
    verified boolean not null,
    created timestamp not null,
    modified timestamp not null,
    primary key (id)
);

/*
    Recovery Phone Numbers: Phone numbers that are registered by users for the purpose of recovery in the case that
                     their main email becomes in-accessable

    Properties:
    - phoneNumber: User specified phoneNumber to be used only for the recovery of the account
    - verified: If the resource has been verified by the user
    - created: When this resource was first created
    - modified: When this resource was last modified

    Keys:
    - Primary Key: id
*/
create table RecoveryPhoneNumbers (
    id int not null auto_increment,
    phoneNumber varchar(20) not null,
    verified boolean not null,
    created timestamp not null,
    modified timestamp not null,
    primary key (id)
);

/*
    Recovery Resources: Resources that are linked to a user's account for the purpose of recovery 

    Keys:
    - Primary Key: id
    - Foreign Key: userId referencing the user's entry in the "Users" table
    - Foreign Key: questionsResourceId referencing the user's security questions in the "SecurityQuestions" table
    - Foreign Key: emailResourceId referencing the user's recovery email in the "RecoveryEmails" table
    - Foreign Key: phoneResourceId referencing the user's recovery phone number in the "RecoveryPhoneNumbers"

    TODOs:
    - Expand table to contain multiple emails/phone numbers

*/
create table RecoveryResources (
    id int not null auto_increment,
    userId int not null,
    questionsResourceId int,
    emailResourceId int,
    phoneResourceId int,
    primary key (id),
    foreign key (userId) references Users(id),
    foreign key (questionsResourceId) references SecurityQuestions(id),
    foreign key (emailResourceId) references RecoveryEmails(id),
    foreign key (phoneResourceId) references RecoveryPhoneNumbers(id)
);

/*
    Verification: Verification tokens to be used by a user to verify their provided resources

    Properties:
    - verificationToken: token that is sent in the verification email for the registering user

    Keys:
    - Primary Key: id
    - Foreign Key: userId referencing the user's entry in the "Users" table
*/
create table Verification (
    id int not null auto_increment,
    userId int not null,
    verificationToken varchar(100) not null,
    primary key (id),
    foreign key (userId) references Users(id)
);

/*
    Audit Logs: Logs to audit the actions taken by users when interacting with the IDP server

    Properties:
    - event: Event being auditited
    - action: Action being taken by the server
    - status: Results of the attempted event and action on the server
    - created: When the log was created

    Keys:
    - Primary Key: id
    - Foreign Key: userId referencing the user's entry in the "Users" table
*/
create table AuditLogs (
    id int not null auto_increment,
    userId int not null,
    event varchar(50) not null,
    action varchar(50) not null,
    status varchar(20) not null,
    created timestamp not null,
    primary key (id),
    foreign key (userId) references Users(id)
);

/*
    Roles: Roles that can be assigned to a user to grant them permissions on different servers
           that rely on the IDP server for authorization

    Properties:
    - roleName: Name of the role that can be granted to a user
    - roleDescription: Description of the role

    Keys:
    - Primary Key: id
*/
create table Roles (
    id int not null auto_increment,
    applicationName varchar(30) not null,
    roleName varchar(30) not null,
    roleDescription varchar(100) not null,
    primary key (id),
    unique key application_role(applicationName, roleName)
);

/*
    Assigned Roles: Roles that have been assigned to specific users registered with the IDP server

    Keys:
    - Primary Key: userId and roleId (Composite)
    - Foreign Key: userId referencing a user's entry in the "Users" table
    - Foreign Key: roleId referencing a role's entry in the "Roles" table 
*/
create table AssignedRoles (
    userId int not null,
    roleId int not null,
    primary key (userId, roleId),
    foreign key (userId) references Users(id),
    foreign key (roleId) references Roles(id) 
);

/*
    Database TODOs:
    - Trigger on Users: Delete user's that do not verify within a certian amount of time
    - Trigger on SecurityQuestions: Ensure that user's update their questions after a certian amount of time
    - Trigger on RecoveryEmails: Ensure the user re-verifies the resource after a certian amount of time
    - Trigger on RecoveryPhoneNumbers: Ensure the user re-verifies that resource after a certain amount of time
    - Condition on RecoveryResources: Ensure that at least one resource is provided
    - Trigger on Verification: Delete the verification entry when a user successfully verifies
    - Trigger on Verification: Delete the verification entry if the user is deleted due to not verifying within the alloted time
    - Condition on AuditLogs: Un-verified users can only perform two actions (Signup and Verification)
*/

-- delimiter //
-- create trigger add_verification_row after insert on Users
--     for each row
--     BEGIN
--         insert into Verification set userId = NEW.id;
--     END;//
-- delimiter ;