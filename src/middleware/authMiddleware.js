const jwtService = require("../services/jwtService");
const logger = require("../logger")(__filename);



module.exports = (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    logger.warn("No Token Provided");
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwtService.verify(token);
    req.user = decoded;
    logger.info("Token Verified");
    next();
  } catch (err) {
    logger.error("Invalid Token", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};
