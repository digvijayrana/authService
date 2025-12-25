const bcrypt = require("bcrypt");
exports.hash = async (p) => bcrypt.hash(p, 10);
exports.verify = async (p, h) => bcrypt.compare(p, h);
