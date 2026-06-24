using {com.epm as db} from './schema';
 
view ProductCatalog as select from db.Products {
    key ID,
    name,
    price,
    supplier.name as supplierName,
    category.name as categoryName,
    cast(
    case
        when stock <= minStock then 'LOW'
        else 'OK'
    end as String(10)
    ) as stockStatus
};
 
view OrderReport as select from db.SalesOrders {
    key ID,
    orderNumber,
    customer.name as customerName,
    amount,
    orderDate,
    status
};
 
view LowStockAlert as select from db.Products {
    key ID,
    name,
    stock,
    minStock,
    supplier.name as supplierName,
    supplier.contact as supplierContact,
    supplier.email as supplierEmail
}
where stock <= minStock;