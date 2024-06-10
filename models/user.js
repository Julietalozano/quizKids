const connection = require('../config/db');

connection.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos.');
});

const User = {};

User.add = (userData, callback) => {
    const sql = 'INSERT INTO Usuarios SET ?';
    connection.query(sql, userData, (err, result) => {
        if (err) throw err;
        callback(result);
    });
};

User.findByEmail = (correo, callback) => {
    const sql = 'SELECT * FROM Usuarios WHERE correo = ?';
    connection.query(sql, [correo], (err, result) => {
        if (err) throw err;
        callback(result[0]);
    });
};

module.exports = User;
