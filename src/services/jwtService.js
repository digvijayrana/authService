const fs = require("fs");
const jwt = require("jsonwebtoken");
const { jwtIssuer, accessTokenTTL } = require("../config/config");

const privateKey = fs.readFileSync("./keys/private.pem");
const publicKey = fs.readFileSync("./keys/public.pem");

exports.generateTenantToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      tenant: user.tenant_id,
      roles: user.roles
    },
    privateKey,
    { algorithm: "RS256", expiresIn: accessTokenTTL, issuer: jwtIssuer }
  );

exports.generateSuperAdminToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      roles: user.roles
    },
    privateKey,
    { algorithm: "RS256", expiresIn: accessTokenTTL, issuer: jwtIssuer }
  );

exports.verify = (token) =>
  jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: jwtIssuer
  });
