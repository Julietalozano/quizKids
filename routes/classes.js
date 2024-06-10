const express = require('express');
const router = express.Router();
const classesController = require('../controllers/classesController');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // Importa el middleware de autenticación

// Mostrar el formulario para crear una nueva clase
router.get('/new', isAuthenticated, classesController.showCreateClassForm);

// Procesar la creación de una nueva clase
router.post('/create', isAuthenticated, classesController.createClass);

module.exports = router;
