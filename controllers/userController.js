const User = require("../models/user"); // Importar el modelo User se usa para interactuar con la base de datos.
const Student = require("../models/student"); // Importar el modelo Student se usa para interactuar con la base de datos.
const Professor = require("../models/professor"); // Importar el modelo Professor se usa para interactuar con la base de datos.

// Crear un objeto controlador este objeto contendrá funciones para manejar las solicitudes de los usuarios.
const userController = {};

// Método para manejar la solicitud de registro de usuario
/*
  userController.register = async (req, res) => {} funciona de la sigueinte manera:
  - Se obtienen los datos del usuario del cuerpo de la solicitud POST.
  - Se crean los datos del usuario con la contraseña en texto plano.
  - Se guarda el usuario en la base de datos.
  - Se redirige al usuario a la página principal de la aplicación.
*/
userController.register = async (req, res) => {
  try {
    const userData = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      fecha_de_nacimiento: req.body.fNacimiento,
      sexo: req.body.sexo,
      pais: req.body.pais,
      ciudad: req.body.ciudad,
      correo: req.body.correo,
      contrasena: req.body.contraseña, // Almacenar la contraseña en texto plano
      tipo_de_usuario: req.body.tipoUsuario,
    };

    // User.add(userData, (result) => {} funciona de la siguiente manera:
    // - Se llama a la función User.add() con los datos del usuario.
    // - Si hay un error, se lanza una excepción.
    // - Si el usuario se guarda correctamente en la base de datos, se llama a la función de devolución de llamada con el resultado de la consulta.
    User.add(userData, (result) => {
      const userId = result.insertId;

      if (req.body.tipoUsuario === "alumno") {
        const alumnoData = { id_usuario: userId, nombre: req.body.nombre };
        Student.add(alumnoData, () => {
          res.redirect("/");
        });
      } else if (req.body.tipoUsuario === "profesor") {
        const profesorData = { id_usuario: userId, nombre: req.body.nombre };
        Professor.add(profesorData, () => {
          res.redirect("/");
        });
      } else {
        res.redirect("/");
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = userController;
