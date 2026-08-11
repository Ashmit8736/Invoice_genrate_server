const prisma = require('../prisma/client');

exports.getSettings = async (req, res, next) => {
    try {
        const settings = await prisma.settings.findFirst();
        if (settings) {
            res.json(settings);
        } else {
            res.json({ message: 'No settings found' });
        }
    } catch (err) {
        next(err);
    }
};

exports.updateSettings = async (req, res, next) => {
    const { company_name, address, gstin, pan, state_code } = req.body;
    try {
        let settings = await prisma.settings.findFirst();
        
        if (settings) {
            settings = await prisma.settings.update({
                where: { id: settings.id },
                data: { company_name, address, gstin, pan, state_code }
            });
            res.json({ message: 'Settings updated successfully', settings });
        } else {
            settings = await prisma.settings.create({
                data: { company_name, address, gstin, pan, state_code }
            });
            res.status(201).json({ message: 'Settings created successfully', settings });
        }
    } catch (err) {
        next(err);
    }
};
