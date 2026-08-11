const express = require('express');
const router = express.Router();
const multer = require('multer');
const invoiceController = require('../controllers/invoiceController');

// Multer setup for Excel upload in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.post('/import', upload.single('file'), invoiceController.importInvoices);

module.exports = router;
