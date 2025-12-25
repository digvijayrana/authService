const router = require("express").Router();
const verify = require("../middleware/authMiddleware");
const platform = require("../services/platformService");

router.post("/tenants", verify, platform.createTenant);

module.exports = router;
