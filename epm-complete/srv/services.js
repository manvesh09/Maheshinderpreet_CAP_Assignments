const cds = require('@sap/cds');
 
module.exports = function () {
 
  // =====================================================
  // SALES ORDERS - Validations
  // =====================================================
 
  this.before('CREATE', 'SalesOrders', async (req) => {
    const { customer_ID, orderDate, items } = req.data;
 
    // 1. Customer is required
    if (!customer_ID) {
      req.error(400, 'Customer is required for orders', 'customer_ID');
    }
 
    // 2. Order date cannot be in the past
    if (orderDate) {
      const today = new Date().toISOString().split('T')[0];
 
      if (orderDate < today) {
        req.error(400, 'Order date cannot be in the past', 'orderDate');
      }
    }
 
    // 3. Must have at least one item
    if (!items || items.length === 0) {
      req.error(400, 'Order must have at least one item');
    }
 
    // 4. Validate each item
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
 
        if (!item.product_ID) {
          req.error(400, `Item ${i + 1}: Product is required`);
        }
 
        if (!item.quantity || item.quantity <= 0) {
          req.error(400, `Item ${i + 1}: Quantity must be greater than zero`);
        }
 
        if (!item.unitPrice || item.unitPrice <= 0) {
          req.error(400, `Item ${i + 1}: Unit price must be greater than zero`);
        }
      }
    }
 
    // 5. Verify customer exists
    if (customer_ID) {
      const customer = await SELECT.one
        .from('com.epm.Customers')
        .where({ ID: customer_ID });
 
      if (!customer) {
        req.error(404, 'Customer not found', 'customer_ID');
      }
    }
  });
 
  // Auto-calculate totals before saving
  this.before('CREATE', 'SalesOrders', (req) => {
    const { items } = req.data;
 
    if (items && items.length > 0) {
      let netAmount = 0;
 
      for (const item of items) {
        item.netAmount = +(item.quantity * item.unitPrice).toFixed(2);
        netAmount += item.netAmount;
      }
 
      req.data.netAmount = +netAmount.toFixed(2);
      req.data.taxAmount = +(netAmount * 0.18).toFixed(2);
      req.data.grossAmount = +(netAmount * 1.18).toFixed(2);
    }
 
    // Set default status
    if (!req.data.status) {
      req.data.status = 'New';
    }
  });
 
  // Status transition validation
  this.before('UPDATE', 'SalesOrders', async (req) => {
    if (req.data.status) {
      const orderId = req.params[0]?.ID || req.params[0];
 
      const order = await SELECT.one
        .from('com.epm.SalesOrders')
        .where({ ID: orderId });
 
      if (!order) {
        req.reject(404, 'Order not found');
      }
 
      const transitions = {
        'New': ['Confirmed', 'Cancelled'],
        'Confirmed': ['Shipped', 'Cancelled'],
        'Shipped': ['Delivered'],
        'Delivered': [],
        'Cancelled': []
      };
 
      const allowed = transitions[order.status] || [];
 
      if (!allowed.includes(req.data.status)) {
        req.reject(
          400,
          `Cannot change status from "${order.status}" to "${req.data.status}". Allowed: ${allowed.join(', ') || 'none (final state)'}`
        );
      }
    }
  });
 
  // Prevent deleting delivered orders
  this.before('DELETE', 'SalesOrders', async (req) => {
    const orderId = req.params[0]?.ID || req.params[0];
 
    const order = await SELECT.one
      .from('com.epm.SalesOrders')
      .where({ ID: orderId });
 
    if (order && order.status === 'Delivered') {
      req.reject(409, 'Cannot delete a delivered order. Archive it instead.');
    }
  });
 
  // =====================================================
  // AFTER READ: Enrich order data
  // =====================================================
 
  this.after('READ', 'SalesOrders', (results) => {
    const orders = Array.isArray(results) ? results : [results];
 
    for (const order of orders) {
      if (order.status) {
        const statusInfo = {
          'New': { priority: 'Normal', color: 'blue' },
          'Confirmed': { priority: 'Normal', color: 'green' },
          'Shipped': { priority: 'High', color: 'orange' },
          'Delivered': { priority: 'Low', color: 'grey' },
          'Cancelled': { priority: 'None', color: 'red' }
        };
 
        const info = statusInfo[order.status];
 
        if (info) {
          order.statusPriority = info.priority;
          order.statusColor = info.color;
        }
      }
    }
  });
 
};
 
module.exports = function () {
 
    // Handler for the GenerateReport action
    this.on('GenerateReport', async (req) => {
        const { reportType, startDate, endDate } = req.data;
 
        // Validate inputs
        if (!reportType) {
            req.reject(400, 'Report type is required');
        }
 
        const validTypes = ['Sales', 'Inventory', 'Customers'];
        if (!validTypes.includes(reportType)) {
            req.reject(
                400,
                `Invalid report type. Must be: ${validTypes.join(', ')}`
            );
        }
 
        if (startDate > endDate) {
            req.reject(400, 'Start date must be before end date');
        }
 
        // Simulate report generation
        const reportId = cds.utils.uuid();
 
        console.log(
            `Generating ${reportType} report from ${startDate} to ${endDate}...`
        );
 
        // In real app: query data, generate PDF, store somewhere
        return {
            reportId: reportId,
            status: 'Generated',
            message: `${reportType} report generated successfully for ${startDate} to ${endDate}`
        };
    });
 
    // Handler for PingHealth
    this.on('PingHealth', (req) => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    });
 
};

module.exports = function () {
 
    const { SalesOrders } = cds.entities;
 
    // ==================================================
    // BOUND ACTION: confirm (on SalesOrders)
    // ==================================================
 
    this.on('confirm', 'SalesOrders', async (req) => {
 
        // Get the specific order this action is called on
        const orderId = req.params[0]?.ID || req.params[0];
 
        // Read the current order
        const order = await SELECT.one.from(SalesOrders).where({ ID: orderId });
 
        if (!order) {
            req.reject(404, 'Order not found');
        }
 
        // Business rule: Can only confirm "New" orders
        if (order.status !== 'New') {
            req.reject(
                400,
                `Cannot confirm order in "${order.status}" status. Only "New" orders can be confirmed`
            );
        }
 
        // Update the order status
        await UPDATE(SalesOrders)
            .set({
                status: 'Confirmed',
                modifiedAt: new Date().toISOString()
            })
            .where({ ID: orderId });
 
        // Return success response
        return {
            status: 'Confirmed',
            message: `Order ${order.orderNumber} confirmed successfully`
        };
    });
 
    // ==================================================
    // BOUND ACTION: cancel (on SalesOrders)
    // ==================================================
 
    this.on('cancel', 'SalesOrders', async (req) => {
 
        const orderId = req.params[0]?.ID || req.params[0];
        const { reason } = req.data;
 
        const order = await SELECT.one.from(SalesOrders).where({ ID: orderId });
 
        if (!order) {
            req.reject(404, 'Order not found');
        }
 
        // Business rule: Cannot cancel delivered orders
        if (order.status === 'Delivered') {
            req.reject(
                400,
                'Cannot cancel a delivered order. Please initiate a return instead'
            );
        }
 
        if (order.status === 'Cancelled') {
            req.reject(400, 'Order is already cancelled');
        }
 
        // Cancel reason is required
        if (!reason || reason.trim() === '') {
            req.reject(400, 'Cancellation reason is required');
        }
 
        // Update order
        await UPDATE(SalesOrders)
            .set({
                status: 'Cancelled',
                modifiedAt: new Date().toISOString()
            })
            .where({ ID: orderId });
 
        // Calculate refund (if already paid)
        const refundAmount =
            (order.status === 'Confirmed' || order.status === 'Shipped')
                ? order.grossAmount
                : 0;
 
        return {
            status: 'Cancelled',
            message: `Order ${order.orderNumber} cancelled. Reason: ${reason}`,
            refundAmount: refundAmount
        };
    });
 
    // ==================================================
    // BOUND ACTION: ship (on SalesOrders)
    // ==================================================
 
    this.on('ship', 'SalesOrders', async (req) => {
 
        const orderId = req.params[0]?.ID || req.params[0];
        const { trackingNumber, carrier } = req.data;
 
        const order = await SELECT.one.from(SalesOrders).where({ ID: orderId });
 
        if (!order) req.reject(404, 'Order not found');
 
        if (order.status !== 'Confirmed') {
            req.reject(
                400,
                `Cannot ship order in "${order.status}" status. Order must be "Confirmed"`
            );
        }
 
        if (!trackingNumber)
            req.reject(400, 'Tracking number is required');
 
        if (!carrier)
            req.reject(400, 'Carrier name is required');
 
        await UPDATE(SalesOrders)
            .set({
                status: 'Shipped',
                modifiedAt: new Date().toISOString()
            })
            .where({ ID: orderId });
 
        // Estimate delivery: 5 business days from now
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5);
 
        return {
            status: 'Shipped',
            message: `Order ${order.orderNumber} shipped via ${carrier}. Tracking: ${trackingNumber}`,
            estimatedDelivery: deliveryDate.toISOString().split('T')[0]
        };
    });
 
};