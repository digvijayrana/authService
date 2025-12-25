const router = require("express").Router();
const auth = require("../services/authService");

router.post("/login", auth.login);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/set-password", auth.setPassword);

module.exports = router;
