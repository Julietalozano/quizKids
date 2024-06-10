const connection = require('../config/db');
const Professor = require('../models/professor');
const Class = require('../models/class');

const professorController = {};

professorController.home = (req, res) => {
    res.render('professor/index', { user: req.session.userId });
};

professorController.perfil = (req, res) => {
    res.render('professor/perfil', { user: req.session.userId });
};

professorController.dashboard = (req, res) => {
    res.render('professor/dashboard', { user: req.session.userId });
};

professorController.crearQuiz = (req, res) => {
    // Lógica para crear un quiz
    res.render('professor/crearQuiz', { user: req.session.userId });
};

professorController.getDashboard = (req, res) => {
    const query = `
        SELECT 
            a.id_alumno AS id,
            a.nombre AS alumno,
            q.id_quiz AS quizId,
            q.nombre AS quiz,
            r.puntaje
        FROM 
            Resultados r
        RIGHT JOIN 
            Alumnos a ON r.id_alumno = a.id_alumno
        RIGHT JOIN 
            Quizes q ON r.id_quiz = q.id_quiz
        ORDER BY 
            a.nombre, q.id_quiz;
    `;
    connection.query(query, (error, results) => {
        if (error) {
            return res.status(500).send(error);
        }
        
        const alumnos = {};
        const quizzes = new Map();
        
        results.forEach(({ id, alumno, quizId, quiz, puntaje }) => {
            if (!alumnos[alumno]) {
                alumnos[alumno] = { id, alumno, quizzes: {} };
            }
            alumnos[alumno].quizzes[quiz] = puntaje;
            quizzes.set(quizId, quiz);  // Guardamos el quizId y el nombre del quiz
        });

        res.render('professor/dashboard', { alumnos: Object.values(alumnos), quizzes: Array.from(quizzes.entries()) });
    });
};

professorController.getQuizResult = (req, res) => {
    const { alumnoId, quizId } = req.query;

    const query = `
        SELECT 
            a.nombre AS alumno,
            q.nombre AS quiz,
            r.puntaje,
            r.nivel_confianza,
            r.resultados
        FROM 
            Resultados r
        JOIN 
            Alumnos a ON r.id_alumno = a.id_alumno
        JOIN 
            Quizes q ON r.id_quiz = q.id_quiz
        WHERE 
            r.id_alumno = ? AND r.id_quiz = ?;
    `;
    connection.query(query, [alumnoId, quizId], (error, results) => {
        if (error) {
            return res.status(500).send(error);
        }

        if (results.length > 0) {
            const result = results[0];
            try {
                result.resultados = JSON.parse(result.resultados);
            } catch (e) {
                result.resultados = []; // Si no es un JSON válido, lo ponemos como una lista vacía
            }

            const preguntasQuery = `
                SELECT 
                    p.id_pregunta,
                    p.contenido,
                    GROUP_CONCAT(r.contenido ORDER BY r.id_respuesta) AS respuestas,
                    GROUP_CONCAT(r.valor ORDER BY r.id_respuesta) AS valores
                FROM 
                    Preguntas p
                JOIN 
                    Respuestas r ON p.id_pregunta = r.id_pregunta
                WHERE 
                    p.id_quiz = ?
                GROUP BY 
                    p.id_pregunta;
            `;

            connection.query(preguntasQuery, [quizId], (err, preguntas) => {
                if (err) {
                    return res.status(500).send(err);
                }

                // Calcular el rendimiento (Performance)
                let correctas = 0;
                let totalPreguntas = preguntas.length;

                // Validar que `result.resultados` es un array
                if (Array.isArray(result.resultados)) {
                    result.resultados.forEach((res, index) => {
                        if (res.correcta) {
                            correctas += 1;
                        }
                    });
                }

                const rendimiento = totalPreguntas > 0 ? (correctas / totalPreguntas) * result.nivel_confianza : 0;

                // Verificar los datos antes de renderizar
                console.log('result:', result);
                console.log('preguntas:', preguntas);
                console.log('rendimiento:', rendimiento);

                res.render('professor/quiz-result', {
                    result,
                    preguntas,
                    rendimiento
                });
            });
        } else {
            res.status(404).send('No se encontraron resultados');
        }
    });
};

module.exports = professorController;
