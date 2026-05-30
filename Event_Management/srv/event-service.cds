using platform.events as db from '../db/schema';
 
service EventService {
 
    entity Venues as projection on db.Venues;
    entity Events as projection on db.Events;
    entity Speakers as projection on db.Speakers;
    entity EventSpeakers as projection on db.EventSpeakers;
    entity Registrations as projection on db.Registrations;
    entity Feedback as projection on db.Feedback;
 
}