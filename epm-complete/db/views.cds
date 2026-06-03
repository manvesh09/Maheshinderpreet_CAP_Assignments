using {com.epm as db} from './schema';
 
view ProductCatalog as select from db.Products {
    name,
    price,
    supplier.name as supplierName,
    category.name as categoryName,
    case
        when stock <= minStock then 'LOW'
        else 'OK'
    end as stockStatus
};
 
view OrderReport as select from db.SalesOrders {
    orderNumber,
    customer.name as customerName,
    amount,
    orderDate,
    status
};
 
view LowStockAlert as select from db.Products {
    name,
    stock,
    minStock,
    supplier.name as supplierName,
    supplier.contact as supplierContact,
    supplier.email as supplierEmail
}
where stock <= minStock;