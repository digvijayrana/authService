const app = require("./app");
const logger = require("./logger")(__filename);

const PORT = 3000;

app.listen(PORT, () => logger.info(`Auth Service running on ${PORT}`));
