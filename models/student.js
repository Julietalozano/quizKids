const connection = require('../config/db');

const Student = {};

Student.add = (alumnoData, callback) => {
    const sql = 'INSERT INTO Alumnos SET ?';
    connection.query(sql, alumnoData, (err, result) => {
        if (err) throw err;
        callback(result);
    });
};

module.exports = Student;
