// using PurchasingService as service from '../../srv/purchasing-service';
// annotate service.PurchaseOrders with @(
//     UI.FieldGroup #GeneratedGroup : {
//         $Type : 'UI.FieldGroupType',
//         Data : [
//             {
//                 $Type : 'UI.DataField',
//                 Label : 'poNumber',
//                 Value : poNumber,
//             },
//             {
//                 $Type : 'UI.DataField',
//                 Label : 'orderDate',
//                 Value : orderDate,
//             },
//             {
//                 $Type : 'UI.DataField',
//                 Label : 'amount',
//                 Value : amount,
//             },
//             {
//                 $Type : 'UI.DataField',
//                 Label : 'currency_code',
//                 Value : currency_code,
//             },
//             {
//                 $Type : 'UI.DataField',
//                 Label : 'status',
//                 Value : status,
//             },
//         ],
//     },
//     UI.Facets : [
//         {
//             $Type : 'UI.ReferenceFacet',
//             ID : 'GeneratedFacet1',
//             Label : 'General Information',
//             Target : '@UI.FieldGroup#GeneratedGroup',
//         },
//     ],
//     UI.LineItem : [
//         {
//             $Type : 'UI.DataField',
//             Label : 'poNumber',
//             Value : poNumber,
//         },
//         {
//             $Type : 'UI.DataField',
//             Label : 'orderDate',
//             Value : orderDate,
//         },
//         {
//             $Type : 'UI.DataField',
//             Label : 'amount',
//             Value : amount,
//         },
//         {
//             $Type : 'UI.DataField',
//             Label : 'currency_code',
//             Value : currency_code,
//         },
//         {
//             $Type : 'UI.DataField',
//             Label : 'status',
//             Value : status,
//         },
//     ],
// );

// annotate service.PurchaseOrders with {
//     supplier @Common.ValueList : {
//         $Type : 'Common.ValueListType',
//         CollectionPath : 'Suppliers',
//         Parameters : [
//             {
//                 $Type : 'Common.ValueListParameterInOut',
//                 LocalDataProperty : supplier_ID,
//                 ValueListProperty : 'ID',
//             },
//             {
//                 $Type : 'Common.ValueListParameterDisplayOnly',
//                 ValueListProperty : 'name',
//             },
//             {
//                 $Type : 'Common.ValueListParameterDisplayOnly',
//                 ValueListProperty : 'contact',
//             },
//             {
//                 $Type : 'Common.ValueListParameterDisplayOnly',
//                 ValueListProperty : 'email',
//             },
//             {
//                 $Type : 'Common.ValueListParameterDisplayOnly',
//                 ValueListProperty : 'phone',
//             },
//         ],
//     }
// };


using { PurchasingService } from '../../srv/purchasing-service';
 
annotate PurchasingService.PurchaseOrders with @UI: {
 
    SelectionFields: [
        poNumber,
        status,
        supplier_ID,
        orderDate
    ],
 
    LineItem: [
        { Value: poNumber, Label: 'PO Number' },
        { Value: supplier.name, Label: 'Supplier' },
        { Value: orderDate, Label: 'Order Date' },
        { Value: amount, Label: 'Amount' },
        { $Type:'UI.DataField',Value: status, Label: 'Status', Criticality: statusCriticality }
    ],
 
    HeaderInfo: {
        TypeName: 'Purchase Order',
        TypeNamePlural: 'Purchase Orders',
        Title: { Value: poNumber },
        Description: { Value: supplier.name }
    },
 
    HeaderFacets: [
        { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Amount' },
        { $Type: 'UI.ReferenceFacet', Target: '@UI.DataPoint#Status' },
    ],
 
    DataPoint#Amount: {
        Value: amount,
        Title: 'Total Amount'
    },
 
    DataPoint#Status: {
        Value: status,
        Title: 'Status',
        Criticality: statusCriticality
    },
 
    Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#General',
            Label: 'General Information'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Dates',
            Label: 'Dates & Delivery'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Target: 'items/@UI.LineItem',
            Label: 'Line Items'
        }
    ],
 
    FieldGroup#General: {
        Data: [
            { Value: poNumber, Label: 'PO Number' },
            { Value: supplier_ID, Label: 'Supplier' },
            { Value: status, Label: 'Status' },
            { Value: totalAmount, Label: 'Total Amount' }
        ]
    },
 
    FieldGroup#Dates: {
        Data: [
            { Value: orderDate, Label: 'Order Date' },
            { Value: expectedDate, Label: 'Expected Delivery' },
            { Value: createdAt, Label: 'Created On' },
            { Value: createdBy, Label: 'Created By' }
        ]
    },
 
    Identification: [
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'PurchasingService.submit',
            Label: 'Submit for Approval'
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'PurchasingService.approve',
            Label: 'Approve'
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'PurchasingService.reject',
            Label: 'Reject'
        }
    ]
};
 
annotate PurchasingService.PurchaseOrders with {
 
    supplier @(
        Common : {
            Text : supplier.name,
            TextArrangement : #TextOnly,
            ValueList : {
                CollectionPath : 'Suppliers',
                Parameters : [
                    {
                        $Type : 'Common.ValueListParameterInOut',
                        LocalDataProperty : supplier_ID,
                        ValueListProperty : 'ID'
                    },
                    {
                        $Type : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty : 'name'
                    },
                    {
                        $Type : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty : 'city'
                    }
                ]
            }
        },
        Common.ValueListWithFixedValues : true,
    );
 
    status @Common.ValueListWithFixedValues;
};
 
annotate PurchasingService.PurchaseOrderItems with @UI: {
 
    LineItem: [
        { Value: product.name, Label: 'Product' },
        { Value: quantity, Label: 'Quantity' },
        { Value: unitPrice, Label: 'Unit Price' }
    ],
 
    HeaderInfo: {
        TypeName: 'PO Item',
        TypeNamePlural: 'PO Items',
        Title: { Value: product.name },
        Description: { Value: quantity }
    },
 
    Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#ItemDetail',
            Label: 'Item Details'
        }
    ],
 
    FieldGroup#ItemDetail: {
        Data: [
            { Value: product_ID, Label: 'Product' },
            { Value: quantity, Label: 'Ordered Qty' },
            { Value: unitPrice, Label: 'Unit Price' }
        ]
    }
};
 
annotate PurchasingService.PurchaseOrderItems with {
 
    product @(
        Common : {
            Text : product.name,
            TextArrangement : #TextOnly,
            ValueList : {
                CollectionPath : 'Products',
                Parameters : [
                    {
                        $Type : 'Common.ValueListParameterInOut',
                        LocalDataProperty : product_ID,
                        ValueListProperty : 'ID'
                    },
                    {
                        $Type : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty : 'name'
                    },
                    {
                        $Type : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty : 'unitPrice'
                    }
                ]
            }
        }
    );
};
// annotate PurchasingService.PurchaseOrderItems with @(
//     Common.SideEffects : {
//         SourceProperties : [
//             quantity,
//             unitPrice
//         ],
//         TargetEntities : [totalAmount]
//     }
// );

annotate PurchasingService.PurchaseOrderItems with @(
    Common.SideEffects#TotalPriceRefresh: {
        SourceProperties: [
            quantity,
            unitPrice
        ],
        TargetProperties: [
            totalPrice
        ]
    }
);

annotate PurchasingService.PurchaseOrders with @(
    Common.SideEffects#AmountRefresh: {
        SourceEntities: [
            items
        ],
        TargetProperties: [
            amount
        ]
    }
);
 
 