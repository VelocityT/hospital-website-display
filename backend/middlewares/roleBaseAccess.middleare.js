export const ROLES = {
  superAdmin: "superAdmin",
  admin: "admin",
  doctor: "doctor",
  nurse: "nurse",
  receptionist: "receptionist",
  pharmacist: "pharmacist",
};

export const secondOrderAccess = ["admin", "doctor"];

export const roleBasedAccess = (allowedRoles = []) => {
  return (req, res, next) => {
    const authority = req.authority?.role;
    if (!authority || !allowedRoles.includes(authority)) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to access this resource.",
      });
    }
    next();
  };
};
