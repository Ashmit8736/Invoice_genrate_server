const xlsx = require('xlsx');
const fs = require('fs');

const data = [];

// Create 10 dummy invoices
for (let i = 1; i <= 10; i++) {
  data.push({
    "Order ID": `BULK-ORD-00${i}`,
    "Invoice Date": "2026-08-11",
    "Customer Name": `Bulk Customer ${i}`,
    "Phone": `987654300${i}`,
    "Shipping Address": `Sector ${i}, Test City`,
    "State Code": "27",
    "GSTIN": "",
    "Payment Mode": i % 2 === 0 ? "Online" : "COD",
    "Fulfillment Type": "Courier",
    "Item Description": `Bulk Item ${i}`,
    "Quantity": i,
    "Unit Price": 1000 + (i * 100),
    "GST Rate (%)": 18
  });
}

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Invoices");

xlsx.writeFile(workbook, 'C:/Users/Ashmit/Desktop/invoice_print/sample_invoices.xlsx');
console.log('Sample Excel file generated successfully.');
