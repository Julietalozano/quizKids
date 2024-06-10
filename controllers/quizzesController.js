const db = require('../config/db');

const showCreateQuizForm = (req, res) => {
    const id_usuario = req.session.user.id_usuario; // Obtener el id_usuario de la sesión
    console.log("ID de usuario en showCreateQuizForm:", id_usuario); // Log para verificar

    const query = `
        SELECT Clases.id_clase
        FROM Clases
        JOIN Profesores ON Clases.id_profesor = Profesores.id_profesor
        WHERE Profesores.id_usuario = ?
        ORDER BY Clases.id_clase DESC
        LIMIT 1;
    `;

    console.log("Ejecutando consulta SQL para obtener id_clase:"); // Log antes de la consulta
    db.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error("Error al obtener el ID de la clase:", err);
            return res.status(500).send('Error al obtener el ID de la clase');
        }

        console.log("Resultados de la consulta SQL:", results); // Log después de la consulta

        if (results.length === 0) {
            console.log("No se encontró ninguna clase para el profesor");
            return res.status(400).send('No se encontró ninguna clase para el profesor');
        }

        const id_clase = results[0].id_clase;
        console.log("ID de la clase obtenida:", id_clase); // Log para verificar

        res.render('professor/create-quiz', { id_clase: id_clase });
    });
};

const createQuiz = (req, res) => {
    const { nombreQuiz, categoria, id_clase, preguntas } = req.body;

    const quizQuery = `INSERT INTO Quizes (id_clase, id_categoria, nombre) VALUES (?, ?, ?)`;
    db.query(quizQuery, [id_clase, categoria, nombreQuiz], (err, result) => {
        if (err) {
            console.error("Error al insertar el quiz:", err);
            return res.status(500).send('Error al crear el quiz');
        }

        const id_quiz = result.insertId;
        console.log("ID del quiz creado:", id_quiz);

        const preguntasPromises = preguntas.map((pregunta) => {
            return new Promise((resolve, reject) => {
                const preguntaQuery = `INSERT INTO Preguntas (id_quiz, contenido) VALUES (?, ?)`;
                db.query(preguntaQuery, [id_quiz, pregunta.pregunta], (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    const id_pregunta = result.insertId;
                    console.log("ID de la pregunta creada:", id_pregunta);

                    const respuestas = [
                        { id_quiz: id_quiz, contenido: pregunta.respuestas[0], valor: pregunta.respuestaCorrecta === '1' ? 1 : 0 },
                        { id_quiz: id_quiz, contenido: pregunta.respuestas[1], valor: pregunta.respuestaCorrecta === '2' ? 1 : 0 },
                        { id_quiz: id_quiz, contenido: pregunta.respuestas[2], valor: pregunta.respuestaCorrecta === '3' ? 1 : 0 }
                    ];

                    const respuestaQuery = `INSERT INTO Respuestas (id_quiz, id_pregunta, contenido, valor) VALUES ?`;
                    const values = respuestas.map(r => [id_quiz, id_pregunta, r.contenido, r.valor]);

                    db.query(respuestaQuery, [values], (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(result);
                    });
                });
            });
        });

        Promise.all(preguntasPromises)
            .then(() => {
                res.json({ message: 'Quiz creado exitosamente' });
            })
            .catch(err => {
                console.error("Error al insertar las preguntas/respuestas:", err);
                res.status(500).send('Error al crear las preguntas/respuestas');
            });
    });
};

module.exports = {
    showCreateQuizForm,
    createQuiz
};
