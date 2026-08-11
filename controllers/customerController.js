const prisma = require('../prisma/client');

exports.getCustomers = async (req, res, next) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { created_at: 'desc' }
        });
        res.json(customers);
    } catch (err) {
        next(err);
    }
};

exports.addCustomer = async (req, res, next) => {
    const { name, shipping_address, phone, gstin, state_code } = req.body;
    try {
        const newCustomer = await prisma.customer.create({
            data: {
                name,
                shipping_address,
                phone,
                gstin: gstin || null,
                state_code
            }
        });
        res.status(201).json({ message: 'Customer added successfully', id: newCustomer.id, customer: newCustomer });
    } catch (err) {
        next(err);
    }
};

exports.updateCustomer = async (req, res, next) => {
    const { id } = req.params;
    const { name, shipping_address, phone, gstin, state_code } = req.body;
    try {
        await prisma.customer.update({
            where: { id: parseInt(id) },
            data: { name, shipping_address, phone, gstin, state_code }
        });
        res.json({ message: 'Customer updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.deleteCustomer = async (req, res, next) => {
    const { id } = req.params;
    try {
        await prisma.customer.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Customer deleted successfully' });
    } catch (err) {
        next(err);
    }
};
