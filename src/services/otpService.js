const pool = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwtService = require("./jwtService");
const logger = require("../logger")(__filename);

const hashOtp = otp => crypto.createHash("sha256").update(otp).digest("hex");


// ---------------- MOBILE VERIFY REQUEST ----------------
exports.mobileVerifyRequest = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile)
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Mobile is required" });

    logger.info(`MOBILE_VERIFY_REQUEST for ${mobile}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO tenant_password_otps (user_id, otp_hash, expires_at)
       SELECT id, $1, NOW() + INTERVAL '5 minutes'
       FROM users WHERE mobile=$2`,
      [hashOtp(otp), mobile]
    );

    logger.info(`OTP generated for ${mobile}: ${otp}`);

    return res.json({ success: true, message: "OTP_SENT" });
  } catch (err) {
    logger.error("MOBILE_VERIFY_REQUEST_ERROR", err);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Failed to send OTP" });
  }
};


// ---------------- MOBILE VERIFY CONFIRM ----------------
exports.mobileVerifyConfirm = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp)
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Mobile & OTP required" });

    logger.info(`MOBILE_VERIFY_CONFIRM for ${mobile}`);

    const { rows } = await pool.query(
      `SELECT tenant_password_otps.*, users.id as user_id
       FROM tenant_password_otps
       JOIN users ON users.id = tenant_password_otps.user_id
       WHERE users.mobile=$1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [mobile]
    );

    if (!rows.length)
      return res.status(400).json({ success: false, code: "OTP_INVALID_OR_EXPIRED", message: "OTP expired or invalid" });

    const record = rows[0];

    if (record.otp_hash !== hashOtp(otp))
      return res.status(400).json({ success: false, code: "OTP_INVALID", message: "Incorrect OTP" });

    await pool.query(
      "UPDATE users SET mobile_verified=true WHERE id=$1",
      [record.user_id]
    );

    await pool.query(
      "UPDATE tenant_password_otps SET used_at = NOW() WHERE user_id=$1",
      [record.user_id]
    );

    logger.info(`MOBILE_VERIFIED for ${mobile}`);

    return res.json({ success: true, message: "MOBILE_VERIFIED" });
  } catch (err) {
    logger.error("MOBILE_VERIFY_CONFIRM_ERROR", err);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Failed to verify mobile" });
  }
};


// ---------------- PASSWORD RESET VIA MOBILE OTP ----------------
exports.passwordOtpRequest = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile)
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Mobile required" });

    logger.info(`PASSWORD_OTP_REQUEST for ${mobile}`);

    const { rows } = await pool.query(
      "SELECT id, mobile_verified FROM users WHERE mobile=$1",
      [mobile]
    );

    if (!rows.length)
      return res.status(404).json({ success: false, code: "USER_NOT_FOUND", message: "User not found" });

    if (!rows[0].mobile_verified)
      return res.status(400).json({ success: false, code: "MOBILE_NOT_VERIFIED", message: "Mobile not verified" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO tenant_password_otps (user_id, otp_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
      [rows[0].id, hashOtp(otp)]
    );

    logger.info(`PASSWORD RESET OTP for ${mobile}: ${otp}`);
    //await smsService.sendSms(mobile, `Your password reset OTP is ${otp}`);
    return res.json({ success: true, message: "OTP_SENT" });
  } catch (err) {
    logger.error("PASSWORD_OTP_REQUEST_ERROR", err);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Failed to request password OTP" });
  }
};


// ---------------- PASSWORD OTP VERIFY ----------------
exports.passwordOtpVerify = async (req, res) => {
  try {
    const { mobile, otp, newPassword } = req.body;

    if (!mobile || !otp || !newPassword)
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Mobile, OTP & password required" });

    logger.info(`PASSWORD_OTP_VERIFY for ${mobile}`);

    const { rows } = await pool.query(
      `SELECT tenant_password_otps.*, users.id as user_id
       FROM tenant_password_otps
       JOIN users ON users.id = tenant_password_otps.user_id
       WHERE users.mobile=$1 AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [mobile]
    );

    if (!rows.length)
      return res.status(400).json({ success: false, code: "OTP_INVALID_OR_EXPIRED", message: "OTP expired or invalid" });

    if (rows[0].otp_hash !== hashOtp(otp))
      return res.status(400).json({ success: false, code: "OTP_INVALID", message: "Incorrect OTP" });

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2",
      [passwordHash, rows[0].user_id]
    );

    await pool.query(
      "UPDATE tenant_password_otps SET used_at=NOW() WHERE id=$1",
      [rows[0].id]
    );

    logger.info(`PASSWORD RESET SUCCESS for ${mobile}`);
    return res.json({ success: true, message: "PASSWORD_RESET_SUCCESS" });
  } catch (err) {
    logger.error("PASSWORD_OTP_VERIFY_ERROR", err);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Failed to reset password" });
  }
};


// ---------------- SUPER ADMIN OTP REQUEST ----------------
exports.superAdminOtpRequest = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile)
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Mobile is required" });

    logger.info(`SUPER_ADMIN_OTP_REQUEST for ${mobile}`);

    const { rows } = await pool.query(
      "SELECT id, metadata->'role' AS roles FROM users WHERE mobile=$1 AND tenant_id IS NULL",
      [mobile]
    );

    if (!rows.length)
      return res.status(404).json({ success: false, code: "SUPER_ADMIN_NOT_FOUND", message: "Super admin not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO super_admin_otps (user_id, otp_hash, expires_at)
       VALUES ($1,$2,NOW() + INTERVAL '5 minutes')`,
      [rows[0].id, hashOtp(otp)]
    );

    logger.info(`SUPER ADMIN OTP: ${otp}`);
   // await smsService.sendSms(mobile, `Your SUPER ADMIN login OTP is ${otp}`);
    return res.json({ success: true, message: "OTP_SENT" });
  } catch (err) {
    logger.error("SUPER_ADMIN_OTP_REQUEST_ERROR", err);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Failed to send super admin OTP" });
  }
};


// ---------------- SUPER ADMIN OTP VERIFY ----------------
exports.superAdminOtpVerify = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp)
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Mobile & OTP required" });

    logger.info(`SUPER_ADMIN_OTP_VERIFY for ${mobile}`);

    const { rows } = await pool.query(
      `SELECT users.id, metadata->'role' AS roles, super_admin_otps.*
       FROM users
       JOIN super_admin_otps ON super_admin_otps.user_id = users.id
       WHERE mobile=$1 AND tenant_id IS NULL
       AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [mobile]
    );

    if (!rows.length)
      return res.status(400).json({ success: false, code: "OTP_INVALID_OR_EXPIRED", message: "OTP expired or invalid" });

    const record = rows[0];

    if (record.otp_hash !== hashOtp(otp))
      return res.status(400).json({ success: false, code: "OTP_INVALID", message: "Incorrect OTP" });

    await pool.query(
      "UPDATE super_admin_otps SET used_at=NOW() WHERE id=$1",
      [record.id]
    );

    const token = jwtService.generateSuperAdminToken(record);

    logger.info(`SUPER_ADMIN LOGIN SUCCESS ${mobile}`);

    return res.json({ success: true, token });
  } catch (err) {
    logger.error("SUPER_ADMIN_OTP_VERIFY_ERROR", err);
    return res.status(500).json({ success: false, code: "SERVER_ERROR", message: "Failed to verify super admin OTP" });
  }
};
