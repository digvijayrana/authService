const router = require("express").Router();
const otp = require("../services/otpService");

router.post("/request", otp.passwordOtpRequest);
router.post("/verify", otp.passwordOtpVerify);

module.exports = router;
