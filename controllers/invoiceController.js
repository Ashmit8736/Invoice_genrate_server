const prisma = require('../prisma/client');
const xlsx = require('xlsx');

exports.getInvoices = async (req, res, next) => {
    try {
        const invoices = await prisma.invoice.findMany({
            include: { customer: true },
            orderBy: { created_at: 'desc' }
        });
        
        const mappedInvoices = invoices.map(inv => ({
            ...inv,
            customer_name: inv.customer ? inv.customer.name : 'Unknown'
        }));
        
        res.json(mappedInvoices);
    } catch (err) {
        next(err);
    }
};

exports.getInvoiceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: { customer: true, items: true }
        });
        
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        
        const mappedInvoice = {
            ...invoice,
            customer_name: invoice.customer?.name,
            shipping_address: invoice.customer?.shipping_address,
            phone: invoice.customer?.phone,
            customer_gstin: invoice.customer?.gstin,
            customer_state: invoice.customer?.state_code
        };
        
        res.json(mappedInvoice);
    } catch (err) {
        next(err);
    }
};

exports.createInvoice = async (req, res, next) => {
    try {
        const {
            order_id, invoice_date, payment_mode, fulfillment_type, status,
            customer_id, net_subtotal, cgst_amount, sgst_amount, igst_amount,
            total_amount, amount_in_words, items
        } = req.body;

        const newInvoice = await prisma.invoice.create({
            data: {
                order_id,
                invoice_date: new Date(invoice_date),
                payment_mode,
                fulfillment_type,
                status,
                customer_id: parseInt(customer_id),
                net_subtotal,
                cgst_amount,
                sgst_amount,
                igst_amount,
                total_amount,
                amount_in_words,
                items: {
                    create: items.map(item => ({
                        description: item.description,
                        supplier_name: item.supplier_name || '',
                        quantity: parseInt(item.quantity),
                        unit_price: item.unit_price,
                        gst_rate: item.gst_rate,
                        total: item.total
                    }))
                }
            }
        });
        
        res.status(201).json({ id: newInvoice.id, message: 'Invoice created successfully' });
    } catch (err) {
        next(err);
    }
};

exports.importInvoices = async (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        const settings = await prisma.settings.findFirst();
        const sellerStateCode = settings ? settings.state_code : '27';
        
        let importedCount = 0;
        
        await prisma.$transaction(async (tx) => {
            for (let row of data) {
                const orderId = row['Order ID'];
                if (!orderId) continue;
                
                let customer = await tx.customer.findFirst({
                    where: { name: row['Customer Name'], phone: String(row['Phone']) }
                });
                
                if (!customer) {
                    customer = await tx.customer.create({
                        data: {
                            name: row['Customer Name'],
                            shipping_address: row['Shipping Address'],
                            phone: String(row['Phone']),
                            gstin: row['GSTIN'] ? String(row['GSTIN']) : null,
                            state_code: row['State Code'] ? String(row['State Code']) : ''
                        }
                    });
                }
                
                const qty = Number(row['Quantity'] || 1);
                const unitPrice = Number(row['Unit Price'] || 0);
                const gstRate = Number(row['GST Rate (%)'] || 18);
                
                const netSubtotal = qty * unitPrice;
                const totalGst = (netSubtotal * gstRate) / 100;
                
                const buyerStateCode = row['State Code'] ? String(row['State Code']) : '';
                let cgst = 0, sgst = 0, igst = 0;
                
                if (sellerStateCode === buyerStateCode) {
                    cgst = totalGst / 2;
                    sgst = totalGst / 2;
                } else {
                    igst = totalGst;
                }
                
                const grandTotal = netSubtotal + totalGst;
                const amountInWords = "Auto Generated from Import";
                
                let invoice = await tx.invoice.findFirst({
                    where: { order_id: String(orderId) }
                });
                
                if (!invoice) {
                    invoice = await tx.invoice.create({
                        data: {
                            order_id: String(orderId),
                            invoice_date: row['Invoice Date'] ? new Date(row['Invoice Date']) : new Date(),
                            payment_mode: row['Payment Mode'] || 'Online',
                            fulfillment_type: row['Fulfillment Type'] || 'Courier',
                            status: 'Paid',
                            customer_id: customer.id,
                            net_subtotal: netSubtotal,
                            cgst_amount: cgst,
                            sgst_amount: sgst,
                            igst_amount: igst,
                            total_amount: grandTotal,
                            amount_in_words: amountInWords
                        }
                    });
                    importedCount++;
                }
                
                await tx.invoiceItem.create({
                    data: {
                        invoice_id: invoice.id,
                        description: row['Item Description'],
                        supplier_name: '',
                        quantity: qty,
                        unit_price: unitPrice,
                        gst_rate: gstRate,
                        total: netSubtotal
                    }
                });
            }
        }, {
            maxWait: 10000,
            timeout: 20000,
        });
        
        res.json({ message: `Successfully imported ${importedCount} invoices!` });
    } catch (err) {
        console.error(err);
        next(err);
    }
};
