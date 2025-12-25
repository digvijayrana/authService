const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./logger")(__filename);

const authRoutes = require("./routes/authRoutes");
const mobileRoutes = require("./routes/mobileRoutes");
const passwordOtpRoutes = require("./routes/passwordOtpRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const platformRoutes = require("./routes/platformRoutes");

// swagger setup can be added here
const swaggerUi = require("swagger-ui-express");
const swagger = require("../swagger.json");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swagger));
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));

app.use("/auth", authRoutes);
app.use("/auth/mobile", mobileRoutes);
app.use("/auth/password/otp", passwordOtpRoutes);
app.use("/auth/super-admin", superAdminRoutes);
app.use("/platform", platformRoutes);

app.get("/", (req, res) => res.send("Auth Service Running"));

logger.info("App Initialized");

module.exports = app;
