const pool = require("../config/db");
const jwtService = require("./jwtService");
const crypto = require("crypto");
const logger = require("../logger")(__filename);

exports.createTenant = async (req, res) => {
  try {
    // --------------- AUTHORIZATION ----------------
    if (!req.user || !req.user.roles || !req.user.roles.includes("super_admin")) {
      logger.warn("FORBIDDEN: Non super admin tried to create tenant");
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Only SUPER_ADMIN can create tenant"
      });
    }

    // --------------- VALIDATION ----------------
    const { tenantName, adminFullName, adminEmail, adminMobile } = req.body;

    if (!tenantName || !adminFullName || !adminEmail || !adminMobile) {
      logger.warn("VALIDATION_FAILED: Tenant create missing fields");
      return res.status(400).json({
        success: false,
        code: "VALIDATION_FAILED",
        message: "tenantName, adminFullName, adminEmail, adminMobile are required"
      });
    }

    logger.info(`TENANT CREATE REQUEST for: ${tenantName}`);

    // --------------- IDs ----------------
    const tenantId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    // --------------- TRANSACTION START ----------------
    await pool.query("BEGIN");

    await pool.query(
      "INSERT INTO tenants (id, name) VALUES ($1,$2)",
      [tenantId, tenantName]
    );

    await pool.query(
      `INSERT INTO users (id, tenant_id, email, mobile, metadata)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        adminId,
        tenantId,
        adminEmail,
        adminMobile,
        JSON.stringify({ role: "TENANT_ADMIN", name: adminFullName })
      ]
    );

    await pool.query(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1,'TENANT_ADMIN')`,
      [adminId]
    );

    await pool.query("COMMIT");

    logger.info(`TENANT CREATED SUCCESS → ${tenantName} (${tenantId})`);

    return res.json({
      success: true,
      message: "TENANT_CREATED",
      tenantId
    });
  }

  // --------------- EXCEPTION HANDLER ----------------
  catch (err) {
    logger.error("TENANT_CREATE_ERROR", err);

    // rollback transaction safely
    try { await pool.query("ROLLBACK"); }
    catch (rollbackErr) {
      logger.error("ROLLBACK_FAILED", rollbackErr);
    }

    // Unique constraint violation
    if (err?.code === "23505") {
      return res.status(400).json({
        success: false,
        code: "DUPLICATE_ENTRY",
        message: "Tenant or Admin already exists"
      });
    }

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create tenant"
    });
  }
};
