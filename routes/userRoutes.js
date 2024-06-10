// En este archivo, se definen las rutas que se relacionan con los usuarios, como el registro de usuarios. 
// Para registrar un usuario, se envía una solicitud POST a la ruta /registrar-usuario. 
// El controlador correspondiente a esta ruta es userController.register.

// Está línea importa el archivo userRoutes.js que contiene las rutas de los usuarios. 

// Está línea importa el módulo express.
const express = require('express');
// Está línea crea un objeto Router de Express.
const router = express.Router();
// Está línea importa el controlador userController.js que contiene las funciones para manejar las solicitudes de los usuarios.
const userController = require('../controllers/userController');

// Está línea define la ruta /registrar-usuario y la asocia con la función register del controlador userController.
router.post('/registrar-usuario', userController.register);

module.exports = router;


// router.post() recibe como parámetros la ruta y la función que manejará la solicitud POST a esa ruta.
// La función userController.register se encarga de manejar la solicitud de registro de usuario. 
// Esta función recibe los datos del usuario, los encripta y los guarda en la base de datos.
// Finalmente, redirige al usuario a la página principal de la aplicación.