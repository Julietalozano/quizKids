// routes/quizzes.js

const express = require('express');
const router = express.Router();
const { showCreateQuizForm, createQuiz } = require('../controllers/quizzesController');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // Importa el middleware de autenticación

// Mostrar el formulario para crear un nuevo quiz
router.get('/new', isAuthenticated, showCreateQuizForm);

// Procesar la creación del nuevo quiz
router.post('/create', isAuthenticated, createQuiz);

module.exports = router;
