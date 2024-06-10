// controllers/studentController.js

const pool = require('../config/db'); // Importa tu configuración de base de datos

const getid_alumno = (id_usuario) => {
    return new Promise((resolve, reject) => {
        console.log(`Buscando id_alumno para id_usuario: ${id_usuario}`);
        const query = 'SELECT id_alumno FROM Alumnos WHERE id_usuario = ?';
        pool.query(query, [id_usuario], (error, results) => {
            if (error) {
                reject(error);
            } else if (results.length > 0) {
                resolve(results[0].id_alumno);
            } else {
                reject(new Error('No se encontró ningún alumno con el ID de usuario proporcionado.'));
            }
        });
    });
};

const studentController = {
    home: (req, res) => {
        res.render('student/index', { user: req.session.userId });
    },
    perfil: (req, res) => {
        res.render('student/perfil', { user: req.session.userId });
    },
    ranking: (req, res) => {
        res.render('student/ranking', { user: req.session.userId });
    },
    // otros métodos que puedas tener
};

module.exports = {
    ...studentController,
    getid_alumno,
};