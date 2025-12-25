const router = require("express").Router();
const otp = require("../services/otpService");

router.post("/verify/request", otp.mobileVerifyRequest);
router.post("/verify/confirm", otp.mobileVerifyConfirm);

module.exports = router;
