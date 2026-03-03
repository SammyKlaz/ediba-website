export const isAdmin = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'super_admin')) {
    next();
  } else {
    return res.status(403).send("Access denied. Admins only.");
  }
};



export const isSuperAdmin = (req, res, next) => {
  if (
    req.session.user &&
    req.session.user.role === "super_admin"
  ) {
    next();
  } else {
    return res
      .status(403)
      .send("Access denied. Super admin only.");
  }
};
