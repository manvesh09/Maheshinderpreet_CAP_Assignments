using hospital.management as db from '../db/schema';
 
service HospitalService {
    entity Departments    as projection on db.Departments;
    entity Doctors        as projection on db.Doctors;
    entity Patients       as projection on db.Patients;
    entity Appointments   as projection on db.Appointments;
    entity MedicalRecords as projection on db.MedicalRecords;
}
 