const connection = require('../config/db');

const Class = {};

Class.add = (claseData, callback) => {
    const sql = 'INSERT INTO Clases SET ?';
    connection.query(sql, claseData, (err, result) => {
        if (err) throw err;
        callback(result);
    });
};

module.exports = Class;
