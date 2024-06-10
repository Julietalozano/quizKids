CREATE TABLE Usuarios (
    id_usuario INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    apellido VARCHAR(50),
    fecha_de_nacimiento DATE,
    sexo VARCHAR(6),
    pais VARCHAR(20),
    ciudad VARCHAR(50),
    correo VARCHAR(50) UNIQUE,
    contrasena VARCHAR(60),  -- Hash bcrypt
    tipo_de_usuario VARCHAR(10),
    fecha_de_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Profesores (
    id_profesor INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nombre VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Alumnos (
    id_alumno INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    nombre VARCHAR(50),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario)
);

CREATE TABLE Clases (
    id_clase INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT,
    nombre VARCHAR(50),
    FOREIGN KEY (id_profesor) REFERENCES Profesores(id_profesor)
);

CREATE TABLE Categorias (
    id_categoria INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE Quizes (
    id_quiz INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_clase INT,
    id_categoria INT,
    nombre VARCHAR(50),
    FOREIGN KEY (id_clase) REFERENCES Clases(id_clase),
    FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)
);

CREATE TABLE Preguntas (
    id_pregunta INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_quiz INT,
    contenido TEXT,
    FOREIGN KEY (id_quiz) REFERENCES Quizes(id_quiz)
);

CREATE TABLE Respuestas (
    id_respuesta INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_pregunta INT,
    id_quiz INT,
    contenido TEXT,
    valor INT,
    FOREIGN KEY (id_pregunta) REFERENCES Preguntas(id_pregunta),
    FOREIGN KEY (id_quiz) REFERENCES Quizes(id_quiz)
);


CREATE TABLE QuizesContestados (
    id_alumno INT,
    id_quiz INT,
    FOREIGN KEY (id_alumno) REFERENCES Alumnos(id_alumno),
    FOREIGN KEY (id_quiz) REFERENCES Quizes(id_quiz)
);

CREATE TABLE Resultados (
    id_resultado INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_alumno INT,
    id_quiz INT,
    puntaje INT,
    nivel_confianza INT,
    resultados TEXT,
    FOREIGN KEY (id_alumno) REFERENCES Alumnos(id_alumno),
    FOREIGN KEY (id_quiz) REFERENCES Quizes(id_quiz)
);
