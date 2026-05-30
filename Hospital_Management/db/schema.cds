namespace hospital.management;
  
type Name       : String(100);
type Phone      : String(15);
type Email      : String(100);
type Amount     : Decimal(10,2);
type MedicalNote: String(500);
 

type Gender : String enum {
    Male;
    Female;
    Other;
}
type BloodGroup : String enum {
    A_POS;
    A_NEG;
    B_POS;
    B_NEG;
    O_POS;
    O_NEG;
    AB_POS;
    AB_NEG;
}
type AppointmentStatus : String enum {
    Scheduled;
    Completed;
    Cancelled;
    NoShow;
}
 
 
entity Departments {
    key ID      : UUID;
    name        : Name;
    floor       : Integer;
    head        : Name;
    capacity    : Integer;
    phone       : Phone;
    isActive    : Boolean default true;
}
 
entity Doctors {
    key ID          : UUID;
    firstName       : Name;
    lastName        : Name;
    specialization  : String(100);
    qualification   : String(100);
    experience      : Integer;
    fee             : Amount;
    department      : Association to Departments;
    phone           : Phone;
    email           : Email;
    availableDays   : String(50);
    isActive        : Boolean default true;
}
 
entity Patients {
    key ID              : UUID;
    firstName           : Name;
    lastName            : Name;
    dateOfBirth         : Date;
    gender              : Gender;
    bloodGroup          : BloodGroup;
    phone               : Phone;
    email               : Email;
    address             : String(255);
    emergencyContact    : Phone;
    registrationDate    : Date;
}
 
entity Appointments {
    key ID              : String(10);
    patient             : Association to Patients;
    doctor              : Association to Doctors;
    appointmentDate     : Date;
    appointmentTime     : Time;
    status              : AppointmentStatus default 'Scheduled';
    reason              : String(255);
    notes               : MedicalNote;
    fee                 : Amount;
}
 
entity MedicalRecords {
    key ID              : UUID;
    patient             : Association to Patients;
    doctor              : Association to Doctors;
    appointment         : Association to Appointments;
    diagnosis           : MedicalNote;
    prescription        : MedicalNote;
    testRecommended     : String(255);
    recordDate          : Date;
}
 