function isAuthenticated(req, res, next) {
  if (req.session.user || req.session.userId) {
      req.user = req.session.user; // Asegurar que req.user esté disponible
      res.locals.userId = req.session.userId; // Asegurar que userId esté disponible
      console.log("Usuario autenticado en middleware:", req.user); // Log para verificar
      console.log("userId autenticado en middleware:", res.locals.userId); // Log para verificar
      next();
  } else {
      res.redirect('/login');
  }
}

const setUserId = (req, res, next) => {
  if (req.session.userId) {
    res.locals.userId = req.session.userId;
  } else {
    res.locals.userId = undefined;
  }
  console.log(`userId en res.locals: ${res.locals.userId}`);
  next();
};

module.exports = { setUserId, isAuthenticated };
