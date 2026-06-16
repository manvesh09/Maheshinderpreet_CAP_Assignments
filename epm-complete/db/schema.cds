namespace com.epm;
 
using {
    cuid,
    managed,
    Currency,
    Country
} from '@sap/cds/common';

type POstatus : String(30) enum {
    Approved;
    Pending;
    Cancelled;
}
 
entity Suppliers : cuid {
    name      : String(100);
    contact   : String(100);
    email     : String(100);
    phone     : String(20);
    city      : String(50);
    country   : Country;
    isActive  : Boolean;
}
 
entity Categories : cuid {
    name            : String(100);
    description     : String(500);
    parentCategory  : Association to Categories;
}
 
entity Products : cuid, managed {
    name        : String(100);
    description : String(500);
    price       : Decimal(15,2);
    currency    : Currency;
    stock       : Integer;
    minStock    : Integer;
    rating      : Decimal(3,2);
 
    supplier    : Association to Suppliers;
    category    : Association to Categories;
}
 
entity Customers : cuid, managed {
    name         : String(100);
    email        : String(100);
    phone        : String(20);
    city         : String(50);
    country      : Country;
    creditLimit  : Decimal(15,2);
}
 
entity SalesOrders : cuid, managed {
    orderNumber : String(30);
    customer    : Association to Customers;
    orderDate   : Date;
    amount      : Decimal(15,2);
    currency    : Currency;
    status      : String(30);
 
    items       : Composition of many SalesOrderItems
                    on items.order = $self;
}
 
entity SalesOrderItems : cuid {
    order      : Association to SalesOrders;
    product    : Association to Products;
    quantity   : Integer;
    unitPrice  : Decimal(15,2);
    netAmount  : Decimal(15,2);
}
 
entity PurchaseOrders : cuid, managed {
    poNumber   : String(30);
    supplier   : Association to Suppliers;
    orderDate  : Date;
    amount     : Decimal(15,2);
    currency   : Currency;
    status     : POstatus;
    statusCriticality: Integer;
 
    items      : Composition of many PurchaseOrderItems
                   on items.order = $self;
}
 
entity PurchaseOrderItems : cuid {
    order      : Association to PurchaseOrders;
    product    : Association to Products;
    quantity   : Integer;
    unitPrice  : Decimal(15,2);
    totalPrice : Decimal(15,2);
}
 