const User = require("../models/user");
const Alumno = require("../models/student");
const Profesor = require("../models/professor");

const authController = {};

authController.register = async (req, res) => {
  try {
      const userData = {
          nombre: req.body.nombre,
          apellido: req.body.apellido,
          fecha_de_nacimiento: req.body.fecha_de_nacimiento,
          estado: req.body.estado,
          correo: req.body.correo,
          contrasena: req.body.contrasena,
          tipo_de_usuario: req.body.tipo_de_usuario,
      };

      User.add(userData, (result) => {
          const userId = result.insertId;

          if (req.body.tipo_de_usuario === "alumno") {
              const alumnoData = { id_usuario: userId, nombre: req.body.nombre };
              Alumno.add(alumnoData, () => {
                  console.log("Usuario registrado y añadido como alumno:", req.session.user); // Log para verificar
                  res.redirect("/login");
              });
          } else if (req.body.tipo_de_usuario === "profesor") {
              const profesorData = { id_usuario: userId, nombre: req.body.nombre };
              Profesor.add(profesorData, () => {
                  console.log("Usuario registrado y añadido como profesor:", req.session.user); // Log para verificar
                  res.redirect("/login");
              });
          } else {
              res.redirect("/");
          }
      });
  } catch (err) {
      res.status(500).send(err.message);
  }
};

authController.login = async (req, res) => {
  try {
      const { correo, contrasena } = req.body;

      User.findByEmail(correo, async (user) => {
          if (!user) {
              return res.status(401).send("Correo o contraseña incorrectos");
          }

          if (contrasena === user.contrasena) {
              req.session.userId = user.id_usuario; // Guardar userId en la sesión
              req.session.user = user; // Almacenar todo el objeto usuario en la sesión
              req.session.tipoDeUsuario = user.tipo_de_usuario;

              console.log("Usuario autenticado en login:", req.session.user, req.session.userId); // Log para verificar

              if (user.tipo_de_usuario === "alumno") {
                  res.redirect("/student");
              } else if (user.tipo_de_usuario === "profesor") {
                  res.redirect("/professor");
              } else {
                  res.redirect("/");
              }
          } else {
              res.status(401).send("Correo o contraseña incorrectos");
          }
      });
  } catch (err) {
      res.status(500).send(err.message);
  }
};

module.exports = authController;
