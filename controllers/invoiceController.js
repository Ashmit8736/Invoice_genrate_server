const db = require('../config/db');
const xlsx = require('xlsx');

exports.getInvoices = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT i.*, c.name as customer_name 
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            ORDER BY i.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.getInvoiceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [invoice] = await db.query(`
            SELECT i.*, c.name as customer_name, c.shipping_address, c.phone, c.gstin as customer_gstin, c.state_code as customer_state
            FROM invoices i 
            JOIN customers c ON i.customer_id = c.id 
            WHERE i.id = ?
        `, [id]);
        
        if (invoice.length === 0) return res.status(404).json({ message: 'Invoice not found' });
        
        const [items] = await db.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [id]);
        
        res.json({ ...invoice[0], items });
    } catch (err) {
        next(err);
    }
};

exports.createInvoice = async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const {
            order_id, invoice_date, payment_mode, fulfillment_type, status,
            customer_id, net_subtotal, cgst_amount, sgst_amount, igst_amount,
            total_amount, amount_in_words, items
        } = req.body;

        const [result] = await connection.query(
            `INSERT INTO invoices 
            (order_id, invoice_date, payment_mode, fulfillment_type, status, customer_id, 
            net_subtotal, cgst_amount, sgst_amount, igst_amount, total_amount, amount_in_words) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [order_id, invoice_date, payment_mode, fulfillment_type, status, customer_id, 
             net_subtotal, cgst_amount, sgst_amount, igst_amount, total_amount, amount_in_words]
        );
        
        const invoiceId = result.insertId;
        
        for (let item of items) {
            await connection.query(
                `INSERT INTO invoice_items 
                (invoice_id, description, supplier_name, quantity, unit_price, gst_rate, total) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [invoiceId, item.description, item.supplier_name || '', item.quantity, item.unit_price, item.gst_rate, item.total]
            );
        }

        await connection.commit();
        res.status(201).json({ id: invoiceId, message: 'Invoice created successfully' });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
};

// Extremely simplified Excel import for demo purposes
// In reality, this would need complex validation
exports.importInvoices = async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const connection = await db.getConnection();
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        await connection.beginTransaction();
        
        // Very basic bulk import logic
        // Expects format: Order ID, Invoice Date, Customer Name, Phone, Shipping Address, State Code, GSTIN, Payment Mode, Fulfillment Type, Item Description, Quantity, Unit Price, GST Rate (%)
        
        // Get settings for calculation
        const [settingsRows] = await connection.query('SELECT state_code FROM settings LIMIT 1');
        const sellerStateCode = settingsRows.length > 0 ? settingsRows[0].state_code : '27';
        
        let importedCount = 0;
        
        for (let row of data) {
            const orderId = row['Order ID'];
            if (!orderId) continue;
            
            // 1. Check or create customer
            let customerId = null;
            const [custRows] = await connection.query('SELECT id FROM customers WHERE name = ? AND phone = ? LIMIT 1', [row['Customer Name'], row['Phone']]);
            
            if (custRows.length > 0) {
                customerId = custRows[0].id;
            } else {
                const [newCust] = await connection.query(
                    'INSERT INTO customers (name, shipping_address, phone, gstin, state_code) VALUES (?, ?, ?, ?, ?)',
                    [row['Customer Name'], row['Shipping Address'], row['Phone'], row['GSTIN'] || '', row['State Code'] || '']
                );
                customerId = newCust.insertId;
            }
            
            // 2. Calculate values
            const qty = Number(row['Quantity'] || 1);
            const unitPrice = Number(row['Unit Price'] || 0);
            const gstRate = Number(row['GST Rate (%)'] || 18);
            
            const netSubtotal = qty * unitPrice;
            const totalGst = (netSubtotal * gstRate) / 100;
            
            const buyerStateCode = row['State Code'] || '';
            let cgst = 0, sgst = 0, igst = 0;
            
            if (sellerStateCode === buyerStateCode) {
                cgst = totalGst / 2;
                sgst = totalGst / 2;
            } else {
                igst = totalGst;
            }
            
            const grandTotal = netSubtotal + totalGst;
            
            // Helper for simple number to words
            const amountInWords = "Auto Generated from Import"; // Simplified for bulk
            
            // 3. Insert Invoice
            // Check if invoice already exists
            const [invRows] = await connection.query('SELECT id FROM invoices WHERE order_id = ?', [orderId]);
            let invoiceId;
            
            if (invRows.length === 0) {
                const [newInv] = await connection.query(
                    `INSERT INTO invoices (order_id, invoice_date, payment_mode, fulfillment_type, status, customer_id, net_subtotal, cgst_amount, sgst_amount, igst_amount, total_amount, amount_in_words) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [orderId, row['Invoice Date'] || new Date().toISOString().split('T')[0], row['Payment Mode'] || 'Online', row['Fulfillment Type'] || 'Courier', 'Paid', customerId, netSubtotal, cgst, sgst, igst, grandTotal, amountInWords]
                );
                invoiceId = newInv.insertId;
                importedCount++;
            } else {
                invoiceId = invRows[0].id;
                // If it exists, we could update or just add the line item. Let's just assume 1 order = 1 invoice for simplicity in this demo
            }
            
            // 4. Insert Item
            await connection.query(
                `INSERT INTO invoice_items (invoice_id, description, supplier_name, quantity, unit_price, gst_rate, total) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [invoiceId, row['Item Description'], '', qty, unitPrice, gstRate, netSubtotal]
            );
        }
        
        await connection.commit();
        res.json({ message: `Successfully imported ${importedCount} invoices!` });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        next(err);
    } finally {
        connection.release();
    }
};
