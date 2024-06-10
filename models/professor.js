const connection = require('../config/db');

const Professor = {};

Professor.add = (profesorData, callback) => {
    const sql = 'INSERT INTO Profesores SET ?';
    connection.query(sql, profesorData, (err, result) => {
        if (err) throw err;
        callback(result);
    });
};

module.exports = Professor;
