using { com.epm as db } from '../db/schema';
 
using {
    ProductCatalog,
    OrderReport,
    LowStockAlert
} from '../db/views';
 
service SalesService {
 entity Products as projection on db.Products;
 entity Customers as projection on db.Customers;
 entity SalesOrders as projection on db.SalesOrders;
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
 