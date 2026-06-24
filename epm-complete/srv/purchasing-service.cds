using { com.epm as db } from '../db/schema';
 
service PurchasingService @(path: '/purchasing') @(requires: 'authenticated-user') {
 
    @odata.draft.enabled
    entity PurchaseOrders @(restrict: [
 
        {
            grant : 'READ',
            to    : 'Viewer',
            where : 'status = ''Approved'' or status = ''Received'''
        },
 
        {
            grant : ['READ', 'CREATE', 'UPDATE'],
            to    : 'PurchaseManager',
            where : 'createdBy = $user'
        },
 
        {
            grant : 'READ',
            to    : 'PurchaseManager',
            where : 'status = ''Submitted'''
        },
 
        {
            grant : '*',
            to    : 'Administrator'
        }
 
    ]) as projection on db.PurchaseOrders
 
    actions {
 
        @requires: 'PurchaseManager'
        action submit()
            returns {
                status  : String;
                message : String;
            };
 
        @requires: ['PurchaseManager', 'Administrator']
        action approve(comment: String(500))
            returns {
                status  : String;
                message : String;
            };
 
        @requires: ['PurchaseManager', 'Administrator']
        action reject(reason: String(500))
            returns {
                status  : String;
                message : String;
            };
 
        @requires: 'PurchaseManager'
        action receive(
            receivedQty : Integer,
            notes       : String(500)
        )
            returns {
                status  : String;
                message : String;
            };
 
        function getSummary() returns {
            poNumber    : String;
            supplier    : String;
            itemCount   : Integer;
            totalAmount : Decimal;
            status      : String;
            daysOpen    : Integer;
        };
 
    };
 
    entity PurchaseOrderItems @(restrict: [
        { grant : 'READ', to : 'Viewer' },
        { grant : '*', to : ['PurchaseManager', 'Administrator'] }
    ]) as projection on db.PurchaseOrderItems;
 
    @readonly
    entity Products as projection on db.Products;
 
    @requires: 'Administrator'
    entity Suppliers as projection on db.Suppliers;
 
    @requires: 'Administrator'
    entity Categories as projection on db.Categories;
 
    function getPurchasingDashboard() returns {
        totalPOs        : Integer;
        draftCount      : Integer;
        pendingApproval : Integer;
        approvedCount   : Integer;
        totalSpend      : Decimal;
    };
 
    event POSubmitted {
        poId         : UUID;
        poNumber     : String;
        supplierName : String;
        totalAmount  : Decimal;
        submittedBy  : String;
    }
 
    event POApproved {
        poId       : UUID;
        poNumber   : String;
        approvedBy : String;
        comment    : String;
    }
 
    event PORejected {
        poId       : UUID;
        poNumber   : String;
        rejectedBy : String;
        reason     : String;
    }
 
}
 
service CatalogService @(path: '/catalog') {
 
    @readonly
    entity Products as projection on db.Products {
        ID,
        name,
        description,
        price,
        stock,
        rating,
        category
    };
 
    @readonly
    entity Categories as projection on db.Categories;
 
}

    

 