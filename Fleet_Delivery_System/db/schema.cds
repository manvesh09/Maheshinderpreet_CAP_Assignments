namespace fleet.delivery;
 
type Phone    : String(15);
type Email    : String(100);
type Amount   : Decimal(10,2);
type Distance : Decimal(10,2);
type City     : String(50);
type Address  : String(200);
type Rating   : Integer;
 
type VehicleType : String enum {
    Bike;
    Van;
    Truck;
    Trailer;
};
 
type FuelType : String enum {
    Petrol;
    Diesel;
    Electric;
    CNG;
};
 
type VehicleStatus : String enum {
    Available;
    OnTrip;
    Maintenance;
    Retired;
};
 
type DriverStatus : String enum {
    Available;
    OnTrip;
    OnLeave;
};
 
type ShipmentStatus : String enum {
    Booked;
    PickedUp;
    InTransit;
    OutForDelivery;
    Delivered;
    Failed;
};
 
type PaymentStatus : String enum {
    Pending;
    Paid;
    COD;
};
 
type CustomerTier : String enum {
    Regular;
    Premium;
    Enterprise;
};
 
entity Vehicles {
    key ID             : UUID;
    registrationNumber : String(30);
    type               : VehicleType;
    make               : String(50);
    model              : String(50);
    year               : Integer;
    capacity           : Decimal(10,2);
    fuelType           : FuelType;
    status             : VehicleStatus default #Available;
    lastServiceDate    : Date;
    mileage            : Integer;
    insuranceExpiry    : Date;
}
 
entity Drivers {
    key ID           : UUID;
    name             : String(100);
    licenseNumber    : String(50);
    licenseExpiry    : Date;
    phone            : Phone;
    email            : Email;
    experience       : Integer;
    rating           : Rating;
    status           : DriverStatus default #Available;
    vehicleId        : UUID;
    joinDate         : Date;
}
 
entity Customers {
    key ID         : UUID;
    name           : String(100);
    company        : String(100);
    phone          : Phone;
    email          : Email;
    address        : Address;
    city           : City;
    pincode        : String(10);
    gstNumber      : String(30);
    tier           : CustomerTier;
}
 
entity Shipments {
    key ID              : UUID;
    trackingNumber      : String(30);
    customerId          : UUID;
    driverId            : UUID;
    vehicleId           : UUID;
    pickupAddress       : Address;
    deliveryAddress     : Address;
    pickupCity          : City;
    deliveryCity        : City;
    weight              : Decimal(10,2);
    status              : ShipmentStatus default #Booked;
    bookedAt            : Timestamp;
    pickedUpAt          : Timestamp;
    deliveredAt         : Timestamp;
    estimatedDelivery   : Timestamp;
    actualDistance      : Distance;
    charges             : Amount;
    paymentStatus       : PaymentStatus default #Pending;
}
 
entity Routes {
    key ID           : UUID;
    fromCity         : City;
    toCity           : City;
    distance         : Distance;
    estimatedHours   : Decimal(6,2);
    tollCharges      : Amount;
    isActive         : Boolean;
}
 
entity ServiceRecords {
    key ID            : UUID;
    vehicleId         : UUID;
    serviceDate       : Date;
    serviceType       : String(30);
    cost              : Amount;
    description       : String(255);
    nextServiceDate   : Date;
}
 