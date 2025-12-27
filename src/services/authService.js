const pool = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwtService = require("./jwtService");
const { success, error } = require("../utils/apiResponse");

const hashToken = t => crypto.createHash("sha256").update(t).digest("hex");


// ---------------- LOGIN ----------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return error(res, 400, "VALIDATION_FAILED", "Email & password are required");

    const { rows } = await pool.query(
      "SELECT id, tenant_id, email, password_hash, metadata->'role' AS roles FROM users WHERE email=$1",
      [email]
    );

    if (!rows.length)
      return error(res, 404, "USER_NOT_FOUND", "User does not exist");

    const user = rows[0];

    const ok = await bcrypt.compare(password, user?.password_hash);
    if (!ok)
      return error(res, 401, "INVALID_PASSWORD", "Incorrect email or password");

    const token = jwtService.generateTenantToken(user);

    return success(res, { token }, "LOGIN_SUCCESS");
  } 
  catch (err) {
    console.error("LOGIN ERROR:", err);
    return error(res, 500, "SERVER_ERROR", "Unable to process login right now");
  }
};


// ---------------- FORGOT PASSWORD ----------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("FORGOT PASSWORD REQ BODY:", req.body);

    if (!email)
      return error(res, 400, "VALIDATION_FAILED", "Email is required");

    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    );

    if (!rows.length)
      return error(res, 404, "USER_NOT_FOUND", "User not registered");

    const userId = rows[0].id;

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
      [userId, tokenHash]
    );

    console.log("EMAIL RESET TOKEN:", token);
    return success(res, null, "RESET_EMAIL_SENT");
  } 
  catch (err) {
    console.error("FORGOT_PASSWORD ERROR:", err);
    return error(res, 500, "SERVER_ERROR", "Failed to request password reset");
  }
};


// ---------------- RESET PASSWORD ----------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return error(res, 400, "VALIDATION_FAILED", "Token & New password required");

    const tokenHash = hashToken(token);

    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!rows.length)
      return error(res, 400, "TOKEN_INVALID_OR_EXPIRED", "Reset link expired or invalid");

    const record = rows[0];

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2",
      [passwordHash, record.user_id]
    );

    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id=$1",
      [record.id]
    );

    return success(res, null, "PASSWORD_RESET_SUCCESS");
  } 
  catch (err) {
    console.error("RESET_PASSWORD ERROR:", err);
    return error(res, 500, "SERVER_ERROR", "Failed to reset password");
  }
};


// ---------------- SET PASSWORD (INVITE) ----------------
exports.setPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return error(res, 400, "VALIDATION_FAILED", "Token & New password required");

    const tokenHash = hashToken(token);

    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!rows.length)
      return error(res, 400, "TOKEN_INVALID_OR_EXPIRED", "Invite token expired or invalid");

    const record = rows[0];

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash=$1 WHERE id=$2",
      [passwordHash, record.user_id]
    );

    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE id=$1",
      [record.id]
    );

    return success(res, null, "PASSWORD_SET_SUCCESS");
  } 
  catch (err) {
    console.error("SET_PASSWORD ERROR:", err);
    return error(res, 500, "SERVER_ERROR", "Failed to set password");
  }
};
