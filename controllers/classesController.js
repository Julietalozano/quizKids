const db = require('../config/db'); // Asegúrate de tener una configuración de base de datos

const showCreateClassForm = (req, res) => {
    console.log("Usuario en showCreateClassForm:", req.user); // Agrega un log para verificar
    res.render('createClass', { user: req.user }); // Asegúrate de pasar el usuario logueado
};

const createClass = (req, res) => {
    console.log("Usuario en createClass:", req.user); // Agrega un log para verificar
    const { nombre } = req.body;
    const id_usuario = req.user.id_usuario; // Usar id_usuario para buscar id_profesor

    if (!id_usuario) {
        return res.status(400).send('ID del usuario no encontrado en la sesión');
    }

    // Buscar id_profesor correspondiente al id_usuario
    const query = 'SELECT id_profesor FROM Profesores WHERE id_usuario = ?';
    db.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error al buscar el ID del profesor');
        }

        if (results.length === 0) {
            return res.status(400).send('No se encontró un profesor con el ID de usuario proporcionado');
        }

        const id_profesor = results[0].id_profesor;

        const insertQuery = 'INSERT INTO Clases (id_profesor, nombre) VALUES (?, ?)';
        db.query(insertQuery, [id_profesor, nombre], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al crear la clase');
            } else {
                const id_clase = result.insertId;
                res.redirect(`/quizzes/new?clase_id=${id_clase}`); // Redirigir al formulario de creación de quiz con el id_clase
            }
        });
    });
};

module.exports = {
    showCreateClassForm,
    createClass
};
