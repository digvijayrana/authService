const { createLogger, format, transports } = require("winston");
const path = require("path");

const logger = (filename) => {
  return createLogger({
    level: "info",
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.label({ label: path.basename(filename) }),
      format.printf(info => 
        `[${info.timestamp}] [${info.level.toUpperCase()}] [${info.label}] ${info.message}`
      )
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: "logs/app.log" })
    ]
  });
};

module.exports = logger;
