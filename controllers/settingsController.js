const db = require('../config/db');

exports.getSettings = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM settings LIMIT 1');
        if (rows.length === 0) {
            return res.json(null);
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

exports.updateSettings = async (req, res, next) => {
    try {
        const { company_name, address, gstin, pan, state_code } = req.body;
        const [existing] = await db.query('SELECT * FROM settings LIMIT 1');
        
        if (existing.length === 0) {
            await db.query('INSERT INTO settings (company_name, address, gstin, pan, state_code) VALUES (?, ?, ?, ?, ?)', [company_name, address, gstin, pan, state_code]);
        } else {
            await db.query('UPDATE settings SET company_name=?, address=?, gstin=?, pan=?, state_code=? WHERE id=?', [company_name, address, gstin, pan, state_code, existing[0].id]);
        }
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        next(err);
    }
};
