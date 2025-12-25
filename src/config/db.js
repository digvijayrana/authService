const { Pool } = require("pg");
const { db } = require("./config");
const logger = require("../logger")(__filename);

const pool = new Pool(db);

pool.on("connect", () => logger.info("DATABASE CONNECTED"));

pool.on("error", (err) => {
  logger.error("DATABASE ERROR", err);
  process.exit(1);
});

module.exports = pool;
