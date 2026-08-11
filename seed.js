const prisma = require('./prisma/client');

async function main() {
  console.log('Seeding database with dummy data...');

  // 1. Create Settings
  const settings = await prisma.settings.create({
    data: {
      company_name: 'Acme Corporation',
      address: '123 Tech Park, Silicon Valley, CA 94025',
      gstin: '27ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      state_code: '27',
    },
  });
  console.log('Settings created.');

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Ramesh Sharma',
      shipping_address: '456 Business Road, Mumbai, MH',
      phone: '9876543210',
      gstin: '27HGHGH1234K1Z2',
      state_code: '27',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Suresh Verma',
      shipping_address: '789 Trade Center, Delhi, DL',
      phone: '9123456780',
      gstin: '07FGFGF4321L1Z3',
      state_code: '07',
    },
  });
  console.log('Customers created.');

  // 3. Create Invoices and Items
  // Invoice 1 (Intra-state, CGST + SGST)
  const invoice1 = await prisma.invoice.create({
    data: {
      order_id: 'ORD-2026-001',
      invoice_date: new Date(),
      payment_mode: 'UPI',
      fulfillment_type: 'Courier',
      status: 'Paid',
      customer_id: customer1.id,
      net_subtotal: 5000.00,
      cgst_amount: 450.00,
      sgst_amount: 450.00,
      igst_amount: 0,
      total_amount: 5900.00,
      amount_in_words: 'Five Thousand Nine Hundred Only',
      items: {
        create: [
          {
            description: 'Web Development Services',
            quantity: 1,
            unit_price: 5000.00,
            gst_rate: 18.00,
            total: 5000.00,
          },
        ],
      },
    },
  });

  // Invoice 2 (Inter-state, IGST)
  const invoice2 = await prisma.invoice.create({
    data: {
      order_id: 'ORD-2026-002',
      invoice_date: new Date(),
      payment_mode: 'Bank Transfer',
      fulfillment_type: 'Email',
      status: 'Pending',
      customer_id: customer2.id,
      net_subtotal: 10000.00,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 1800.00,
      total_amount: 11800.00,
      amount_in_words: 'Eleven Thousand Eight Hundred Only',
      items: {
        create: [
          {
            description: 'Annual Maintenance Contract',
            quantity: 1,
            unit_price: 8000.00,
            gst_rate: 18.00,
            total: 8000.00,
          },
          {
            description: 'Server Hosting',
            quantity: 1,
            unit_price: 2000.00,
            gst_rate: 18.00,
            total: 2000.00,
          },
        ],
      },
    },
  });
  console.log('Invoices created.');
  
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
