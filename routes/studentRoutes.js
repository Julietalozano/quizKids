// routes/studentRoutes.js

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { getid_alumno, home, perfil, ranking } = require('../controllers/studentController');

router.get('/', isAuthenticated, home);
router.get('/perfil', isAuthenticated, perfil);
router.get('/ranking', isAuthenticated, ranking);
router.get('/testit', isAuthenticated, (req, res) => {
    const userId = res.locals.userId;
    const categoriaSeleccionada = req.query.categoria || 'Todas';

    if (!userId) {
        return res.status(400).send('No se proporcionó el ID de usuario');
    }

    getid_alumno(userId).then(id_alumno => {
        pool.query('SELECT id_quiz FROM QuizesContestados WHERE id_alumno = ?', [id_alumno], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Error en la base de datos');
            } else {
                const contestados = result.map(row => row.id_quiz);

                let query = 'SELECT Quizes.*, Categorias.nombre AS categoria FROM Quizes JOIN Categorias ON Quizes.id_categoria = Categorias.id_categoria';
                let queryParams = [];

                if (categoriaSeleccionada !== 'Todas') {
                    query += ' WHERE Categorias.nombre = ?';
                    queryParams.push(categoriaSeleccionada);
                }

                pool.query(query, queryParams, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.status(500).send('Error en la base de datos');
                    } else {
                        let quizzes = result.map(row => ({
                            nombre: row.nombre,
                            id: row.id_quiz,
                            categoria: row.categoria,
                            contestado: contestados.includes(row.id_quiz)
                        }));

                        quizzes.sort((a, b) => {
                            if (a.contestado && !b.contestado) return 1;
                            if (!a.contestado && b.contestado) return -1;
                            return 0;
                        });

                        pool.query('SELECT nombre FROM Categorias', (err, categoriasResult) => {
                            if (err) {
                                console.log(err);
                                res.status(500).send('Error en la base de datos');
                            } else {
                                const Categorias = categoriasResult.map(row => row.nombre);
                                res.render('student/testit', { quizzes, Categorias, categoriaSeleccionada });
                            }
                        });
                    }
                });
            }
        });
    }).catch(err => {
        console.log(err);
        res.status(500).send('Error en la base de datos');
    });
});

module.exports = router;
