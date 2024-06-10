const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const { setUserId } = require('./middlewares/authMiddleware');
const pool = require('./config/db');
const { exec } = require('child_process');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Rutas de usuarios y autenticación
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Rutas específicas de alumnos y profesores
const studentRoutes = require('./routes/studentRoutes');
const professorRoutes = require('./routes/professorRoutes');

// Rutas para las clases y quizzes
const classRoutes = require('./routes/classes');
const quizRoutes = require('./routes/quizzes');

// Crear la aplicación de Express
const app = express();
const port = 3000; // Puerto en el que correrá el servidor

// Configuración de middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());
app.use(session({
  secret: 'tu_secreto',
  resave: false,
  saveUninitialized: true
}));

// Usar middleware para configurar res.locals.userId
app.use(setUserId);

// Middleware para añadir userId a res.locals
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Función para verificar el tipo de usuario
function checkUserType(tipo) {
  return function (req, res, next) {
    if (req.session.tipoDeUsuario === tipo) {
      next();
    } else {
      res.status(403).send('Acceso denegado');
    }
  };
}

// Configuración del motor de plantillas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Rutas estáticas
app.use(express.static('public'));

// Ruta de inicio, definida antes de cargar cualquier otra ruta
app.get('/', (req, res, next) => {
  if (req.originalUrl === '/') {
    res.render('index');
  } else {
    next();
  }
});

// Cargar rutas
app.use('/', userRoutes);
app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/classes', classRoutes);
app.use('/quizzes', quizRoutes);
app.use(professorRoutes); // Esta línea debe permanecer sin cambios

// Otras rutas
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Rutas específicas para alumnos
app.get('/student', checkUserType('alumno'), (req, res) => {
  res.render('student/index');
});

// Rutas para obtener datos de los quizzes
app.get('/learnit', (req, res) => {
  const scriptPath = path.join('ia', 'app.py');
  const command = `streamlit run ${scriptPath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send('Error ejecutando el comando');
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.send('Streamlit app is running');
  });
  setTimeout(() => {
    res.render('student/index')
  }, 2000); // Espera de 2 segundos;
});

// Nueva ruta para obtener quizzes por categoría
app.get('/testit', checkUserType('alumno'), (req, res) => {
  let userId = res.locals.userId;
  const categoriaSeleccionada = req.query.categoria || 'Todas';

  getid_alumno(userId).then(id_alumno => {
    pool.query('SELECT id_clase FROM Alumnos WHERE id_alumno = ?', [id_alumno], (err, alumnoResult) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error en la base de datos');
      } else {
        const id_clase = alumnoResult[0].id_clase;

        pool.query('SELECT id_quiz FROM QuizesContestados WHERE id_alumno = ?', [id_alumno], (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).send('Error en la base de datos');
          } else {
            const contestados = result.map(row => row.id_quiz);

            let query = `
              SELECT Quizes.*, Categorias.nombre AS categoria 
              FROM Quizes 
              JOIN Categorias ON Quizes.id_categoria = Categorias.id_categoria
              WHERE Quizes.id_clase = ?
            `;
            let queryParams = [id_clase];

            if (categoriaSeleccionada !== 'Todas') {
              query += ' AND Categorias.nombre = ?';
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

                // Ordenar los quizzes para que los contestados estén al final
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
      }
    });
  }).catch(err => {
    console.log(err);
    res.status(500).send('Error en la base de datos');
  });
});

// Rutas específicas para profesores
app.get('/professor', checkUserType('profesor'), (req, res) => {
  res.render('professor/index');
});

app.get('/professor-dashboard', checkUserType('profesor'), (req, res) => {
  res.render('professor/dashboard');
});

app.get('/professor-profile', checkUserType('profesor'), (req, res) => {
  let userId = res.locals.userId;

  pool.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error en la base de datos');
    } else {
      const avatarMap = {
        1: '../imgs/cat-avatar.png',
        2: '../imgs/dog-avatar.png',
        3: '../imgs/panda-avatar.png',
        4: '../imgs/giraffe-avatar.png',
        default: '../imgs/user-avatar.png'
      };

      function getAvatarPath(avatarId) {
        return avatarMap[avatarId] || avatarMap.default;
      }

      res.render('professor/profile', { user: result[0], avatar: getAvatarPath(result[0].avatar) });
    }
  });
});

app.get('/professor-ranking', checkUserType('profesor'), (req, res) => {
  let userId = res.locals.userId;

  // Obtener el id_profesor basado en el userId
  pool.query('SELECT id_profesor FROM Profesores WHERE id_usuario = ?', [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error en la base de datos');
    } else {
      if (result.length === 0) {
        res.status(404).send('Profesor no encontrado');
        return;
      }

      let id_profesor = result[0].id_profesor;

      const query = `
        SELECT A.nombre, SUM(R.puntaje) AS total_puntaje
        FROM Resultados R
        JOIN Alumnos A ON R.id_alumno = A.id_alumno
        JOIN Clases C ON A.id_clase = C.id_clase
        WHERE C.id_profesor = ?
        GROUP BY A.nombre
        ORDER BY total_puntaje DESC;
      `;

      pool.query(query, [id_profesor], (error, results) => {
        if (error) {
          throw error;
        }

        res.render('professor/ranking', { ranking: results });
      });
    }
  });
});

app.get('/professor-create-quiz', checkUserType('profesor'), (req, res) => {
  res.render('professor/create-quiz');
});

app.get('/professor-settings', checkUserType('profesor'), (req, res) => {
  const userId = res.locals.userId;

  const sql = 'SELECT id_profesor FROM Profesores WHERE id_usuario = ?';
  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error /professor-settings', err);
    } else {
      id_profesor = result[0].id_profesor;
    }

    const sql = 'SELECT id_clase FROM Clases WHERE id_profesor = ?';
    pool.query(sql, [id_profesor], (err, result) => {
      if (err) {
        console.error('Error /professor-settings', err);
      } else {
        const classCode = result[0].id_clase;
        res.render('professor/settings', { classCode });
      }

    });
  });
});

// Ruta para tomar un quiz
let questions = [];
let respuestas = [];
let resumen = [];

app.get('/take-quiz', checkUserType('alumno'), (req, res) => {
  const quizId = req.query.quizId;
  req.session.quizId = quizId;
  questions = [];
  respuestas = [];

  getid_alumno(res.locals.userId).then(id_alumno => {
    pool.query('SELECT * FROM QuizesContestados WHERE id_quiz = ? AND id_alumno = ?', [quizId, id_alumno], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error en la base de datos');
      } else if (result.length > 0) {
        res.render('student');
        console.log(result);
      } else {
        pool.query('SELECT * FROM Preguntas WHERE id_quiz = ?', [quizId], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            result.forEach(row => {
              questions.push([row.contenido, row.id_pregunta]);
            });
          }
        });

        pool.query('SELECT * FROM Respuestas WHERE id_quiz = ?', [quizId], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            result.forEach(row => {
              respuestas.push([row.id_pregunta, row.contenido, row.valor]);
            });
            res.render('student/quiz', { questions, respuestas });
          }
        });
      }
    });
  });
});

const getid_alumno = id_usuario => {
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

// Ruta para enviar el quiz
app.post('/submit-quiz', (req, res) => {
  let promedio = 0;

  questions.forEach((question, i) => {
    resumen.push([question[0], req.body[i]]);
    const confidenceLevel = req.body.confidence_level[i];
    if (confidenceLevel === 'High') {
      promedio += 3;
    } else if (confidenceLevel === 'Medium') {
      promedio += 2;
    } else if (confidenceLevel === 'Low') {
      promedio += 1;
    }
  });

  promedio /= questions.length;
  const score = calculateScore(req.body);
  res.render('student/result', { score });

  questions = [];
  respuestas = [];

  const insertResult = (id_alumno, id_quiz, puntaje, nivel_confianza, resultados) => {
    const query = `
      INSERT INTO Resultados (id_alumno, id_quiz, puntaje, nivel_confianza, resultados)
      VALUES (?, ?, ?, ?, ?);
    `;

    const values = [id_alumno, id_quiz, puntaje, nivel_confianza, resultados];

    pool.query(query, values, (error, results) => {
      if (error) {
        console.error('Error ejecutando la consulta', error);
      } else {
        console.log('Resultado insertado:', results.insertId);
      }
    });
  };

  const quizIdd = req.session.quizId;

  getid_alumno(res.locals.userId).then(id_alumno => {
    insertResult(id_alumno, quizIdd, score, promedio, `${resumen}`);

    const insertarEnQuizesContestados = (id_alumno, id_quiz) => {
      const insertQuery = `
        INSERT INTO QuizesContestados (id_alumno, id_quiz)
        VALUES (?, ?);
      `;

      const values = [id_alumno, id_quiz];

      pool.query(insertQuery, values, (error, results, fields) => {
        if (error) {
          console.error('Error insertando en quizes_contestados', error);
          return;
        }
        console.log('Inserción exitosa en quizes_contestados:', results);
      });
    };

    insertarEnQuizesContestados(id_alumno, quizIdd);
  });
});

// Función para calcular la puntuación
function calculateScore(userAnswers) {
  let score = 0;
  for (const answer in userAnswers) {
    if (userAnswers[answer] === '1') {
      score++;
    }
  }
  return score;
}

// Rutas para perfil de estudiante
app.get('/student-profile', checkUserType('alumno'), (req, res) => {
  let userId = res.locals.userId;

  pool.query('SELECT * FROM Usuarios WHERE id_usuario = ?', [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error en la base de datos');
    } else {
      const avatarMap = {
        1: '../imgs/cat-avatar.png',
        2: '../imgs/dog-avatar.png',
        3: '../imgs/panda-avatar.png',
        4: '../imgs/giraffe-avatar.png',
        default: '../imgs/user-avatar.png'
      };

      function getAvatarPath(avatarId) {
        return avatarMap[avatarId] || avatarMap.default;
      }

      res.render('student/profile', { user: result[0], avatar: getAvatarPath(result[0].avatar) });
    }
  });
});

app.post('/update-profile', (req, res) => {
  let userId = res.locals.userId;
  let { nombre, apellido, correo, avatar } = req.body;

  // Si el avatar es un valor vacío o no está definido, asignar un valor por defecto
  if (!avatar) {
    avatar = 0; // ID para un avatar por defecto
  }

  let query = `UPDATE Usuarios SET nombre = ?, apellido = ?, correo = ?, avatar = ? WHERE id_usuario = ?`;
  pool.query(query, [nombre, apellido, correo, avatar, userId], (err, result) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: 'Error en la base de datos' });
    } else {
      res.json({ success: true, message: 'Perfil actualizado exitosamente' });
    }
  });
});

// Rutas para ranking de estudiante
app.get('/student-ranking', (req, res) => {
  let userId = res.locals.userId;

  // Obtener el id_alumno y id_clase basado en el userId
  pool.query('SELECT id_alumno, id_clase FROM Alumnos WHERE id_usuario = ?', [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error en la base de datos');
    } else {
      if (result.length === 0) {
        res.status(404).send('Alumno no encontrado');
        return;
      }

      let id_alumno = result[0].id_alumno;
      let id_clase = result[0].id_clase;

      const query = `
        SELECT A.nombre, A.id_alumno, SUM(R.puntaje) AS total_puntaje, U.avatar
        FROM Resultados R
        JOIN Alumnos A ON R.id_alumno = A.id_alumno
        JOIN Usuarios U ON A.id_usuario = U.id_usuario
        WHERE A.id_clase = ?
        GROUP BY R.id_alumno, A.nombre, U.avatar
        ORDER BY total_puntaje DESC;
      `;

      pool.query(query, [id_clase], (error, results) => {
        if (error) {
          throw error;
        }

        // Encontrar el ranking personal
        let personalRanking = -1;
        for (let i = 0; i < results.length; i++) {
          if (results[i].id_alumno === id_alumno) {
            personalRanking = i + 1;
            break;
          }
        }

        // Si el alumno no ha respondido ningún quiz
        if (personalRanking === -1) {
          personalRanking = "Answer a quiz first";
        }

        const avatarMap = {
          1: '../imgs/cat-avatar.png',
          2: '../imgs/dog-avatar.png',
          3: '../imgs/panda-avatar.png',
          4: '../imgs/giraffe-avatar.png',
          default: '../imgs/user-avatar.png'
        };

        results = results.map(row => {
          return {
            ...row,
            avatarPath: avatarMap[row.avatar] || avatarMap.default
          };
        });

        res.render('student/ranking', { ranking: results, personalRanking: personalRanking, totalAlumnos: results.length });
      });
    }
  });
});

// Rutas para configuración de estudiante
app.get('/student-settings', checkUserType('alumno'), (req, res) => {
  const userId = res.locals.userId;

  const sql = 'SELECT id_clase FROM Alumnos WHERE id_usuario = ?';
  pool.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('Error /student-settings', error);
    } else {
      const classCode = result[0].id_clase;
      res.render('student/settings', { classCode });
    }

  });
});

app.post('/addClass', (req, res) => {
  let classCode = req.body.classCode;
  let userId = res.locals.userId;

  // Verificar si la clase existe en la tabla Clases
  let checkClassQuery = `SELECT * FROM Clases WHERE id_clase = ?`;
  pool.query(checkClassQuery, [classCode], (err, result) => {
    if (err) {
      console.error(err);
      res.json({ success: false, message: 'Error en la base de datos' });
    } else {
      if (result.length === 0) {
        // La clase no existe
        res.json({ success: false, message: 'Clase no existe' });
      } else {
        // La clase existe, proceder con la actualización
        let updateQuery = `UPDATE Alumnos SET id_clase = ? WHERE id_usuario = ?`;
        pool.query(updateQuery, [classCode, userId], (err, result) => {
          if (err) {
            console.error(err);
            res.json({ success: false, message: 'Error en la base de datos' });
          } else {
            res.json({ success: true, message: 'Clase registrada exitosamente' });
          }
        });
      }
    }
  });
});

app.get('/getClass', (req, res) => {
  let userId = res.locals.userId;

  let query = `SELECT id_clase FROM Alumnos WHERE id_usuario = ?`;
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.json({ success: false });
    } else {
      let classId = results[0].id_clase;
      res.json({ success: true, classId: classId });
    }
  });
});

// Rutas para resultados de quizzes
app.get('/quiz-result', (req, res) => {
  const quizId = req.query.quizId;
  const userId = res.locals.userId;

  pool.query('SELECT id_alumno FROM Alumnos WHERE id_usuario = ?', [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send('Error en la base de datos');
    } else if (result.length === 0) {
      res.status(404).send('Alumno no encontrado');
      return;
    }

    const id_alumno = result[0].id_alumno;

    const query = `
      SELECT R.resultados, R.puntaje, R.nivel_confianza
      FROM Resultados R
      WHERE R.id_quiz = ? AND R.id_alumno = ?
    `;

    pool.query(query, [quizId, id_alumno], (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send('Error en la base de datos');
      } else if (results.length === 0) {
        res.status(404).send('Resultados no encontrados');
      } else {
        const parsedResults = [];
        const resultado = results[0].resultados.split(',');
        const nivel_confianza = results[0].nivel_confianza;

        const preguntasQuery = `
          SELECT P.id_pregunta, P.contenido
          FROM Preguntas P
          WHERE P.id_quiz = ?
        `;

        pool.query(preguntasQuery, [quizId], (err, preguntas) => {
          if (err) {
            console.log(err);
            res.status(500).send('Error en la base de datos');
          } else {
            preguntas.forEach((pregunta, index) => {
              const correct = resultado[index * 2 + 1] === '1';
              const respuestasQuery = `
                SELECT R.contenido, R.valor
                FROM Respuestas R
                WHERE R.id_pregunta = ?
              `;

              pool.query(respuestasQuery, [pregunta.id_pregunta], (err, respuestas) => {
                if (err) {
                  console.log(err);
                  res.status(500).send('Error en la base de datos');
                } else {
                  parsedResults.push({
                    pregunta: pregunta.contenido,
                    correcta: correct,
                    respuestas: respuestas.map(resp => ({ texto: resp.contenido, correcta: resp.valor === 1 }))
                  });

                  if (parsedResults.length === preguntas.length) {
                    res.render('student/quiz-result', { results: parsedResults, nivel_confianza: nivel_confianza });
                  }
                }
              });
            });
          }
        });
      }
    });
  });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
