using { com.epm as db } from '../db/schema';
 
using {
    ProductCatalog,
    OrderReport,
    LowStockAlert
} from '../db/views';
 

service SalesService @(path: '/sales') {
 
    entity Products as projection on db.Products;
 
    entity Customers as projection on db.Customers;
 
    entity SalesOrders as projection on db.SalesOrders actions {
        action confirm();
        action cancel(
            reason : String(500)
        ) returns {
            status : String(20);
            message : String(200);
            refundAmount : Decimal(12,2);
        };
 
        action ship(
            trackingNumber : String(50),
            carrier : String(50)
        ) returns {
            status : String(20);
            message : String(200);
            estimatedDelivery : Date;
        };
    };
}
 
 
service AdminService {
    entity Suppliers as projection on db.Suppliers;
    entity Categories as projection on db.Categories;
    entity Products as projection on db.Products;
    entity Customers as projection on db.Customers;
    entity SalesOrders as projection on db.SalesOrders;
    entity PurchaseOrders as projection on db.PurchaseOrders;
}
 
service ReportService {
    @readonly
    entity ProductCatalogReport as projection on ProductCatalog;
    @readonly
    entity OrderReportView as projection on OrderReport;
    @readonly
    entity LowStockAlertView as projection on LowStockAlert;
}

service AnalyticsService @(path: '/analytics') {

action GenerateReport(
    reportType : String(20),
    startDate  : Date,
    endDate    : Date
) returns {
    reportId : UUID;
    status   : String(20);
    message  : String(200);
};
 
action PingHealth() returns {
    status    : String(10);
    timestamp : DateTime;
    version   : String(20);
};
}

