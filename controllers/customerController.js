const db = require('../config/db');

exports.getCustomers = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

exports.addCustomer = async (req, res, next) => {
    try {
        const { name, shipping_address, phone, gstin, state_code } = req.body;
        const [result] = await db.query(
            'INSERT INTO customers (name, shipping_address, phone, gstin, state_code) VALUES (?, ?, ?, ?, ?)',
            [name, shipping_address, phone, gstin, state_code]
        );
        res.status(201).json({ id: result.insertId, message: 'Customer added successfully' });
    } catch (err) {
        next(err);
    }
};

exports.updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, shipping_address, phone, gstin, state_code } = req.body;
        await db.query(
            'UPDATE customers SET name=?, shipping_address=?, phone=?, gstin=?, state_code=? WHERE id=?',
            [name, shipping_address, phone, gstin, state_code, id]
        );
        res.json({ message: 'Customer updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteCustomer = async (req, res, next) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM customers WHERE id=?', [id]);
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        next(err);
    }
};
