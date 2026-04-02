const jwt = require("jsonwebtoken");

exports.createToken = (payload) => {
   return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
         expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      }
   );
};


exports.verifyToken = (token) => {
   return jwt.verify(token, process.env.JWT_SELETE);
};