// const cds = require('@sap/cds');
 
// module.exports = function () {
// this.before(['CREATE', 'UPDATE'], 'PurchaseOrderItems.drafts', async (req) => {
//     const data = req.data;
//     let quantity = data.quantity;
//     let unitPrice = data.unitPrice;
//     if (req.event === 'UPDATE') {
//         const oldItem = await SELECT.one.from('PurchasingService.PurchaseOrderItems.drafts')
//             .where({ ID: data.ID });
//         if (oldItem) {
//             quantity = quantity ?? oldItem.quantity;
//             unitPrice = unitPrice ?? oldItem.unitPrice;
//         }
//     }
//     data.totalPrice = Number(quantity || 0) * Number(unitPrice || 0);
//     console.log('DRAFT ITEM CALCULATED:', data);
// });
//     // ============================================================
//     // SUBMIT Purchase Order
//     // ============================================================
//     this.on('submit', async (req) => {
//         console.log("PARAMS = ", req.params);
//         console.log("DATA = ", req.data);
//         const { ID } = req.params[0];
//         const { PurchaseOrders, PurchaseOrderItems, Suppliers } = cds.entities;
 
//         // Fetch the PO
//         const po = await SELECT.one.from(req.subject);
//         console.log("PO = ", po);
//         if (!po) req.reject(404, 'Purchase Order not found');
 
//         // Rule: Only Draft POs can be submitted
//         if (po.status !== 'Draft') {
//             req.reject(
//                 400,
//                 `Cannot submit: PO is in "${po.status}" status. Only Draft POs can be submitted.`
//             );
//         }
 
//         // Rule: PO must have at least one item
//         const items = await SELECT.from(PurchaseOrderItems).where({
//             order_ID: ID
//         });
//         console.log("ITEMS = ", items);
 
//         // if (items.length === 0) {
//         //     req.reject(
//         //         400,
//         //         'Cannot submit: PO has no items. Add at least one item first.'
//         //     );
//         // }
 
//         // Rule: Total amount must be calculated
//         const total = items.reduce(
//             (sum, item) => sum + (item.quantity * item.unitPrice),
//             0
//         );
 
//         // Update status
//         await UPDATE(PurchaseOrders).set({
//             status: 'Submitted',
//             amount: +total.toFixed(2)
//         }).where({ ID });
 
//         // Get supplier name for event
//         const supplier = await SELECT.one.from(Suppliers).where({
//             ID: po.supplier_ID
//         });
 
//         // Emit event
//         await this.emit('POSubmitted', {
//             poId: ID,
//             poNumber: po.poNumber,
//             supplierName: supplier?.supplierName || 'Unknown',
//             amount: +total.toFixed(2),
//             submittedBy: req.user.id
//         });
 
//         return {
//             status: 'Submitted',
//             message: `PO ${po.poNumber} submitted for approval. Total: $${total.toFixed(2)} (${items.length} items)`
//         };
//     });
 
//     // ============================================================
//     // APPROVE Purchase Order
//     // ============================================================
 
//     this.on('approve', 'PurchaseOrders', async (req) => {
//         const { ID } = req.params[0];
//         const { comment } = req.data;
//         const { PurchaseOrders } = cds.entities;
 
//         const po = await SELECT.one.from(PurchaseOrders).where({ ID });
//         if (!po) req.reject(404, 'Purchase Order not found');
 
//         if (po.status !== 'Submitted') {
//             req.reject(
//                 400,
//                 `Cannot approve: PO is in "${po.status}" status. Only Submitted POs can be approved.`
//             );
//         }
 
//         await UPDATE(PurchaseOrders).set({
//             status: 'Approved'
//         }).where({ ID });
 
//         // Emit event
//         await this.emit('POApproved', {
//             poId: ID,
//             poNumber: po.poNumber,
//             approvedBy: req.user.id,
//             comment: comment || ''
//         });
 
//         return {
//             status: 'Approved',
//             message: `PO ${po.poNumber} has been approved.${comment ? ' Comment: ' + comment : ''}`,
//             approvedAt: new Date().toISOString()
//         };
//     });
 
//     // ============================================================
//     // REJECT Purchase Order
//     // ============================================================
 
//     this.on('reject', 'PurchaseOrders', async (req) => {
//         const { ID } = req.params[0];
//         const { reason } = req.data;
//         const { PurchaseOrders } = cds.entities;
 
//         const po = await SELECT.one.from(PurchaseOrders).where({ ID });
//         if (!po) req.reject(404, 'Purchase Order not found');
 
//         if (po.status !== 'Submitted') {
//             req.reject(
//                 400,
//                 `Cannot reject: PO is in "${po.status}" status. Only Submitted POs can be rejected.`
//             );
//         }
 
//         if (!reason || reason.trim() === '') {
//             req.reject(
//                 400,
//                 'Rejection reason is required. Please explain why this PO is being rejected.'
//             );
//         }
 
//         await UPDATE(PurchaseOrders).set({
//             status: 'Rejected'
//         }).where({ ID });
 
//         // Emit event
//         await this.emit('PORejected', {
//             poId: ID,
//             poNumber: po.poNumber,
//             rejectedBy: req.user.id,
//             reason: reason
//         });
 
//         return {
//             status: 'Rejected',
//             message: `PO ${po.poNumber} rejected. Reason: ${reason}`
//         };
//     });
 
//     // ============================================================
//     // RECEIVE Purchase Order (goods arrived)
//     // ============================================================
 
//     this.on('receive', 'PurchaseOrders', async (req) => {
//         const { ID } = req.params[0];
//         const { notes } = req.data;
//         const { PurchaseOrders, PurchaseOrderItems, Products } = cds.entities;
 
//         const po = await SELECT.one.from(PurchaseOrders).where({ ID });
//         if (!po) req.reject(404, 'Purchase Order not found');
 
//         if (po.status !== 'Approved') {
//             req.reject(
//                 400,
//                 `Cannot receive: PO must be "Approved". Current status: "${po.status}"`
//             );
//         }
 
//         // Update PO status
//         await UPDATE(PurchaseOrders).set({
//             status: 'Received'
//         }).where({ ID });
 
//         // Increase stock for each item
//         const items = await SELECT.from(PurchaseOrderItems).where({
//             purchaseOrder_ID: ID
//         });
 
//         for (const item of items) {
//             const product = await SELECT.one.from(Products).where({
//                 ID: item.product_ID
//             });
 
//             if (product) {
//                 await UPDATE(Products).set({
//                     stock: product.stock + item.quantity
//                 }).where({
//                     ID: item.product_ID
//                 });
//             }
//         }
 
//         return {
//             status: 'Received',
//             message: `PO ${po.poNumber} received. Stock updated for ${items.length} products.${notes ? ' Notes: ' + notes : ''}`
//         };
//     });
 
//     // ============================================================
//     // BOUND FUNCTION: getSummary
//     // ============================================================
 
//     this.on('getSummary', 'PurchaseOrders', async (req) => {
//         const { ID } = req.params[0];
//         const { PurchaseOrders, PurchaseOrderItems, Suppliers } = cds.entities;
 
//         const po = await SELECT.one.from(PurchaseOrders).where({ ID });
//         if (!po) req.reject(404, 'Purchase Order not found');
 
//         const items = await SELECT.from(PurchaseOrderItems).where({
//             purchaseOrder_ID: ID
//         });
 
//         const supplier = await SELECT.one.from(Suppliers).where({
//             ID: po.supplier_ID
//         });
 
//         // Calculate days open
//         const createdDate = new Date(po.createdAt || po.orderDate);
//         const today = new Date();
//         const daysOpen = Math.floor(
//             (today - createdDate) / (1000 * 60 * 60 * 24)
//         );
 
//         const totalAmount = items.reduce(
//             (sum, item) => sum + (item.quantity * item.unitPrice),
//             0
//         );
 
//         return {
//             poNumber: po.poNumber,
//             supplier: supplier?.supplierName || 'Unknown',
//             itemCount: items.length,
//             totalAmount: +totalAmount.toFixed(2),
//             status: po.status,
//             daysOpen: daysOpen
//         };
//     });
 

// // ============================================================
// // UNBOUND FUNCTION: getPurchasingDashboard
// // ============================================================
 
// this.on('getPurchasingDashboard', async (req) => {
//     const { PurchaseOrders } = cds.entities;
 
//     const allPOs = await SELECT.from(PurchaseOrders);
 
//     return {
//         totalPOs: allPOs.length,
//         draftCount: allPOs.filter(p => p.status === 'Draft').length,
//         pendingApproval: allPOs.filter(p => p.status === 'Submitted').length,
//         approvedCount: allPOs.filter(p => p.status === 'Approved').length,
//         totalSpend: +allPOs
//             .filter(p => ['Approved', 'Received'].includes(p.status))
//             .reduce((sum, p) => sum + (p.totalAmount || 0), 0)
//             .toFixed(2)
//     };
// });
 
// // ============================================================
// // EVENT LISTENERS
// // ============================================================
 
// this.on('POSubmitted', (msg) => {
//     const { poNumber, supplierName, totalAmount, submittedBy } = msg.data;
 
//     console.log(`\n📋 [PO SUBMITTED] ${poNumber}`);
//     console.log(`   Supplier: ${supplierName}`);
//     console.log(`   Amount: $${totalAmount}`);
//     console.log(`   By: ${submittedBy}`);
//     console.log(`   → Waiting for approval...\n`);
// });
 
// this.on('POApproved', (msg) => {
//     const { poNumber, approvedBy, comment } = msg.data;
 
//     console.log(`\n✅ [PO APPROVED] ${poNumber}`);
//     console.log(`   Approved by: ${approvedBy}`);
//     if (comment) console.log(`   Comment: ${comment}`);
//     console.log(`   → Ready for goods receipt\n`);
// });
 
// this.on('PORejected', (msg) => {
//     const { poNumber, rejectedBy, reason } = msg.data;
 
//     console.log(`\n❌ [PO REJECTED] ${poNumber}`);
//     console.log(`   Rejected by: ${rejectedBy}`);
//     console.log(`   Reason: ${reason}`);
//     console.log(`   → Returned to requester\n`);
//   });


//   this.after(['CREATE', 'UPDATE', 'DELETE'], 'PurchaseOrderItems.drafts', async (data, req) => {
//     const item = data.ID
//         ? await SELECT.one.from('PurchasingService.PurchaseOrderItems.drafts').where({ ID: data.ID })
//         : null;
//     const orderId = data.order_ID || req.data.order_ID || item?.order_ID;
//     if (!orderId) return;
//     const items = await SELECT.from('PurchasingService.PurchaseOrderItems.drafts')
//         .where({ order_ID: orderId });
//     const total = items.reduce((sum, item) => {
//         return sum + Number(item.totalPrice || 0);
//     }, 0);

//     await UPDATE('PurchasingService.PurchaseOrders.drafts')
//         .set({ amount: +total.toFixed(2) })
//         .where({ ID: orderId });
//     console.log('DRAFT PO AMOUNT UPDATED:', orderId, total);
// });
// };

const cds = require('@sap/cds');
module.exports = function () {
   // Security: createdBy should always come from logged-in user
   this.before('CREATE', 'PurchaseOrders', (req) => {
       req.data.createdBy = req.user.id;
   });
   // Calculate draft item totalPrice
   this.before(['CREATE', 'UPDATE'], 'PurchaseOrderItems.drafts', async (req) => {
       const data = req.data;
       let quantity = data.quantity;
       let unitPrice = data.unitPrice;
       if (req.event === 'UPDATE') {
           const oldItem = await SELECT.one
               .from('PurchasingService.PurchaseOrderItems.drafts')
               .where({ ID: data.ID });
           if (oldItem) {
               quantity = quantity ?? oldItem.quantity;
               unitPrice = unitPrice ?? oldItem.unitPrice;
           }
       }
       data.totalPrice = Number(quantity || 0) * Number(unitPrice || 0);
       console.log('DRAFT ITEM CALCULATED:', data);
   });
   // Submit Purchase Order
   this.on('submit', 'PurchaseOrders', async (req) => {
       const { ID } = req.params[0];
       const { PurchaseOrders, PurchaseOrderItems, Suppliers } = cds.entities;
       const po = await SELECT.one.from(PurchaseOrders).where({ ID });
       if (!po) req.reject(404, 'Purchase Order not found');
       // Security: only owner or admin can submit
       if (!req.user.is('Administrator') && po.createdBy !== req.user.id) {
           req.reject(403, 'You can only submit your own Purchase Orders');
       }
       if (po.status !== 'Draft') {
           req.reject(
               400,
               `Cannot submit: PO is in "${po.status}" status. Only Draft POs can be submitted.`
           );
       }
       const items = await SELECT.from(PurchaseOrderItems).where({
           purchaseOrder_ID: ID
       });
       if (items.length === 0) {
           req.reject(
               400,
               'Cannot submit: PO has no items. Add at least one item first.'
           );
       }
       const total = items.reduce(
           (sum, item) => sum + (item.quantity * item.unitPrice),
           0
       );
       await UPDATE(PurchaseOrders).set({
           status: 'Submitted',
           amount: +total.toFixed(2)
       }).where({ ID });
       const supplier = await SELECT.one.from(Suppliers).where({
           ID: po.supplier_ID
       });
       await this.emit('POSubmitted', {
           poId: ID,
           poNumber: po.poNumber,
           supplierName: supplier?.supplierName || 'Unknown',
           totalAmount: +total.toFixed(2),
           submittedBy: req.user.id
       });
       return {
           status: 'Submitted',
           message: `PO ${po.poNumber} submitted for approval. Total: $${total.toFixed(2)} (${items.length} items)`
       };
   });
   // Approve Purchase Order
   this.on('approve', 'PurchaseOrders', async (req) => {
       const { ID } = req.params[0];
       const { comment } = req.data;
       const { PurchaseOrders } = cds.entities;
       const po = await SELECT.one.from(PurchaseOrders).where({ ID });
       if (!po) req.reject(404, 'Purchase Order not found');
       if (po.status !== 'Submitted') {
           req.reject(
               400,
               `Cannot approve: PO is in "${po.status}" status. Only Submitted POs can be approved.`
           );
       }
       // Security: requester cannot approve their own PO
       if (po.createdBy === req.user.id && !req.user.is('Administrator')) {
           req.reject(
               403,
               'You cannot approve your own Purchase Order'
           );
       }
       await UPDATE(PurchaseOrders).set({
           status: 'Approved'
       }).where({ ID });
       await this.emit('POApproved', {
           poId: ID,
           poNumber: po.poNumber,
           approvedBy: req.user.id,
           comment: comment || ''
       });
       return {
           status: 'Approved',
           message: `PO ${po.poNumber} has been approved.${comment ? ' Comment: ' + comment : ''}`,
           approvedAt: new Date().toISOString()
       };
   });
   // Reject Purchase Order
   this.on('reject', 'PurchaseOrders', async (req) => {
       const { ID } = req.params[0];
       const { reason } = req.data;
       const { PurchaseOrders } = cds.entities;
       const po = await SELECT.one.from(PurchaseOrders).where({ ID });
       if (!po) req.reject(404, 'Purchase Order not found');
       if (po.status !== 'Submitted') {
           req.reject(
               400,
               `Cannot reject: PO is in "${po.status}" status. Only Submitted POs can be rejected.`
           );
       }
       if (!reason || reason.trim() === '') {
           req.reject(
               400,
               'Rejection reason is required. Please explain why this PO is being rejected.'
           );
       }
       await UPDATE(PurchaseOrders).set({
           status: 'Rejected'
       }).where({ ID });
       await this.emit('PORejected', {
           poId: ID,
           poNumber: po.poNumber,
           rejectedBy: req.user.id,
           reason: reason
       });
       return {
           status: 'Rejected',
           message: `PO ${po.poNumber} rejected. Reason: ${reason}`
       };
   });
   // Receive Purchase Order
   this.on('receive', 'PurchaseOrders', async (req) => {
       const { ID } = req.params[0];
       const { notes } = req.data;
       const { PurchaseOrders, PurchaseOrderItems, Products } = cds.entities;
       const po = await SELECT.one.from(PurchaseOrders).where({ ID });
       if (!po) req.reject(404, 'Purchase Order not found');
       if (po.status !== 'Approved') {
           req.reject(
               400,
               `Cannot receive: PO must be "Approved". Current status: "${po.status}"`
           );
       }
       await UPDATE(PurchaseOrders).set({
           status: 'Received'
       }).where({ ID });
       const items = await SELECT.from(PurchaseOrderItems).where({
           purchaseOrder_ID: ID
       });
       for (const item of items) {
           const product = await SELECT.one.from(Products).where({
               ID: item.product_ID
           });
           if (product) {
               await UPDATE(Products).set({
                   stock: product.stock + item.quantity
               }).where({
                   ID: item.product_ID
               });
           }
       }
       return {
           status: 'Received',
           message: `PO ${po.poNumber} received. Stock updated for ${items.length} products.${notes ? ' Notes: ' + notes : ''}`
       };
   });
   // Bound Function: getSummary
   this.on('getSummary', 'PurchaseOrders', async (req) => {
       const { ID } = req.params[0];
       const { PurchaseOrders, PurchaseOrderItems, Suppliers } = cds.entities;
       const po = await SELECT.one.from(PurchaseOrders).where({ ID });
       if (!po) req.reject(404, 'Purchase Order not found');
       const items = await SELECT.from(PurchaseOrderItems).where({
           purchaseOrder_ID: ID
       });
       const supplier = await SELECT.one.from(Suppliers).where({
           ID: po.supplier_ID
       });
       const createdDate = new Date(po.createdAt || po.orderDate);
       const today = new Date();
       const daysOpen = Math.floor(
           (today - createdDate) / (1000 * 60 * 60 * 24)
       );
       const totalAmount = items.reduce(
           (sum, item) => sum + (item.quantity * item.unitPrice),
           0
       );
       return {
           poNumber: po.poNumber,
           supplier: supplier?.supplierName || 'Unknown',
           itemCount: items.length,
           totalAmount: +totalAmount.toFixed(2),
           status: po.status,
           daysOpen: daysOpen
       };
   });
   // Unbound Function: getPurchasingDashboard
   this.on('getPurchasingDashboard', async () => {
       const { PurchaseOrders } = cds.entities;
       const allPOs = await SELECT.from(PurchaseOrders);
       return {
           totalPOs: allPOs.length,
           draftCount: allPOs.filter(p => p.status === 'Draft').length,
           pendingApproval: allPOs.filter(p => p.status === 'Submitted').length,
           approvedCount: allPOs.filter(p => p.status === 'Approved').length,
           totalSpend: +allPOs
               .filter(p => ['Approved', 'Received'].includes(p.status))
               .reduce((sum, p) => sum + (p.amount || 0), 0)
               .toFixed(2)
       };
   });
   // Event Listeners
   this.on('POSubmitted', (msg) => {
       const { poNumber, supplierName, totalAmount, submittedBy } = msg.data;
       console.log(`\n📋 [PO SUBMITTED] ${poNumber}`);
       console.log(`   Supplier: ${supplierName}`);
       console.log(`   Amount: $${totalAmount}`);
       console.log(`   By: ${submittedBy}`);
       console.log(`   → Waiting for approval...\n`);
   });
   this.on('POApproved', (msg) => {
       const { poNumber, approvedBy, comment } = msg.data;
       console.log(`\n✅ [PO APPROVED] ${poNumber}`);
       console.log(`   Approved by: ${approvedBy}`);
       if (comment) console.log(`   Comment: ${comment}`);
       console.log(`   → Ready for goods receipt\n`);
   });
   this.on('PORejected', (msg) => {
       const { poNumber, rejectedBy, reason } = msg.data;
       console.log(`\n❌ [PO REJECTED] ${poNumber}`);
       console.log(`   Rejected by: ${rejectedBy}`);
       console.log(`   Reason: ${reason}`);
       console.log(`   → Returned to requester\n`);
   });
   // Update draft PO amount when draft items change
   this.after(['CREATE', 'UPDATE', 'DELETE'], 'PurchaseOrderItems.drafts', async (data, req) => {
       const item = data.ID
           ? await SELECT.one
               .from('PurchasingService.PurchaseOrderItems.drafts')
               .where({ ID: data.ID })
           : null;
       const orderId = data.order_ID || req.data.order_ID || item?.order_ID;
       if (!orderId) return;
       const items = await SELECT
           .from('PurchasingService.PurchaseOrderItems.drafts')
           .where({ order_ID: orderId });
       const total = items.reduce((sum, item) => {
           return sum + Number(item.totalPrice || 0);
       }, 0);
       await UPDATE('PurchasingService.PurchaseOrders.drafts')
           .set({ amount: +total.toFixed(2) })
           .where({ ID: orderId });
       console.log('DRAFT PO AMOUNT UPDATED:', orderId, total);
   });
};