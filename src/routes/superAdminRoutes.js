const router = require("express").Router();
const otp = require("../services/otpService");

router.post("/otp/request", otp.superAdminOtpRequest);
router.post("/otp/verify", otp.superAdminOtpVerify);

module.exports = router;
