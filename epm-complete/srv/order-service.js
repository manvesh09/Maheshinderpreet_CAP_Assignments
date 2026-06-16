const cds = require('@sap/cds');
 
module.exports = function () {
 
    // =====================================================
    // BOUND ACTION: confirm
    // =====================================================
    this.on('confirm', 'Orders', async (req) => {
        const { ID } = req.params[0];
        const { SalesOrders } = cds.entities;
 
        const order = await SELECT.one.from(SalesOrders).where({ ID });
        if (!order) req.reject(404, 'Order not found');
 
        if (order.status !== 'New') {
            req.reject(
                400,
                `Cannot confirm: Order is "${order.status}". Only "New" orders can be confirmed.`
            );
        }
 
        await UPDATE(SalesOrders)
            .set({ status: 'Confirmed' })
            .where({ ID });
 
        return {
            status: 'Confirmed',
            message: `Order ${order.orderNumber} has been confirmed and is ready for processing.`
        };
    });
 
    // =====================================================
    // BOUND ACTION: cancel
    // =====================================================
    this.on('cancel', 'Orders', async (req) => {
        const { ID } = req.params[0];
        const { reason } = req.data;
        const { SalesOrders } = cds.entities;
 
        const order = await SELECT.one.from(SalesOrders).where({ ID });
        if (!order) req.reject(404, 'Order not found');
 
        if (order.status === 'Delivered') {
            req.reject(
                400,
                'Cannot cancel a delivered order. Please initiate a return.'
            );
        }
 
        if (order.status === 'Cancelled') {
            req.reject(400, 'Order is already cancelled.');
        }
 
        if (!reason) {
            req.reject(400, 'Please provide a reason for cancellation.');
        }
 
        await UPDATE(SalesOrders)
            .set({ status: 'Cancelled' })
            .where({ ID });
 
        const refund = ['Confirmed', 'Shipped'].includes(order.status)
            ? order.grossAmount
            : 0;
 
        return {
            status: 'Cancelled',
            message: `Order ${order.orderNumber} cancelled. Reason: ${reason}`,
            refund: refund
        };
    });
 
    // =====================================================
    // BOUND ACTION: ship
    // =====================================================
    this.on('ship', 'Orders', async (req) => {
        const { ID } = req.params[0];
        const { trackingNumber, carrier } = req.data;
        const { SalesOrders } = cds.entities;
 
        const order = await SELECT.one.from(SalesOrders).where({ ID });
        if (!order) req.reject(404, 'Order not found');
 
        if (order.status !== 'Confirmed') {
            req.reject(
                400,
                `Cannot ship: Order must be "Confirmed". Current status: "${order.status}"`
            );
        }
 
        if (!trackingNumber) {
            req.reject(400, 'Tracking number is required');
        }
 
        if (!carrier) {
            req.reject(400, 'Carrier name is required');
        }
 
        await UPDATE(SalesOrders)
            .set({ status: 'Shipped' })
            .where({ ID });
 
        return {
            status: 'Shipped',
            message: `Order ${order.orderNumber} shipped via ${carrier}. Tracking: ${trackingNumber}`
        };
    });
 
    // =====================================================
    // BOUND ACTION: deliver
    // =====================================================
    this.on('deliver', 'Orders', async (req) => {
        const { ID } = req.params[0];
        const { SalesOrders } = cds.entities;
 
        const order = await SELECT.one.from(SalesOrders).where({ ID });
        if (!order) req.reject(404, 'Order not found');
 
        if (order.status !== 'Shipped') {
            req.reject(
                400,
                `Cannot mark as delivered: Order must be "Shipped". Current: "${order.status}"`
            );
        }
 
        await UPDATE(SalesOrders)
            .set({ status: 'Delivered' })
            .where({ ID });
 
        return {
            status: 'Delivered',
            message: `Order ${order.orderNumber} has been delivered successfully!`
        };
    });
 
    // =====================================================
    // BOUND FUNCTION: getTotal
    // =====================================================
    this.on('getTotal', 'Orders', async (req) => {
        const { ID } = req.params[0];
 
        const items = await SELECT.from('com.epm.SalesOrderItems')
            .where({ order_ID: ID });
 
        const net = items.reduce(
            (sum, item) => sum + (item.quantity * item.unitPrice),
            0
        );
 
        const tax = net * 0.18;
 
        return {
            net: +net.toFixed(2),
            tax: +tax.toFixed(2),
            gross: +(net + tax).toFixed(2)
        };
    });
 
    // =====================================================
    // UNBOUND ACTION: bulkConfirm
    // =====================================================
    this.on('bulkConfirm', async (req) => {
        const { orderIds } = req.data;
        const { SalesOrders } = cds.entities;
 
        if (!orderIds || orderIds.length === 0) {
            req.reject(400, 'Please provide at least one order ID');
        }
 
        let confirmed = 0;
        let failed = 0;
 
        for (const id of orderIds) {
            const order = await SELECT.one
                .from(SalesOrders)
                .where({ ID: id });
 
            if (order && order.status === 'New') {
                await UPDATE(SalesOrders)
                    .set({ status: 'Confirmed' })
                    .where({ ID: id });
 
                confirmed++;
            } else {
                failed++;
            }
        }
 
        return {
            confirmed,
            failed,
            message: `Bulk operation complete: ${confirmed} confirmed, ${failed} skipped/failed`
        };
    });
 
    // =====================================================
    // UNBOUND FUNCTION: getOrderStats
    // =====================================================
    this.on('getOrderStats', async (req) => {
        const { year, month } = req.data;
 
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
 
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
 
        const endDate =
            `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
 
        const orders = await SELECT.from('com.epm.SalesOrders')
            .where('orderDate >=', startDate)
            .and('orderDate <', endDate);
 
        const stats = {
            totalOrders: orders.length,
            newOrders: orders.filter(o => o.status === 'New').length,
            confirmedOrders: orders.filter(o => o.status === 'Confirmed').length,
            shippedOrders: orders.filter(o => o.status === 'Shipped').length,
            deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
            cancelledOrders: orders.filter(o => o.status === 'Cancelled').length,
            totalRevenue: +orders
                .reduce((sum, o) => sum + (o.grossAmount || 0), 0)
                .toFixed(2)
        };
 
        return stats;
    });
 
    // =====================================================
    // UNBOUND FUNCTION: getTopCustomers
    // =====================================================
    this.on('getTopCustomers', async (req) => {
        const limit = req.data.limit || 5;
 
        const orders = await SELECT.from('com.epm.SalesOrders')
            .columns('customer_ID', 'grossAmount');
 
        const customerMap = {};
 
        for (const order of orders) {
            if (!customerMap[order.customer_ID]) {
                customerMap[order.customer_ID] = {
                    count: 0,
                    total: 0
                };
            }
 
            customerMap[order.customer_ID].count++;
            customerMap[order.customer_ID].total += order.grossAmount || 0;
        }
 
        const results = [];
 
        for (const [id, data] of Object.entries(customerMap)) {
            const customer = await SELECT.one
                .from('com.epm.Customers')
                .where({ ID: id })
                .columns('customerName');
 
            if (customer) {
                results.push({
                    customerName: customer.customerName,
                    orderCount: data.count,
                    totalSpent: +data.total.toFixed(2)
                });
            }
        }
 
        return results
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
    });
 
};
 