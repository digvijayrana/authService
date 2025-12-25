module.exports = {
  jwtIssuer: "auth.vidyarthilekha",
  accessTokenTTL: "15m",

  db: {
    host: "localhost",
    port: 5432,
    database: "authdb",
    user: "postgres",
    password: "12345"
  }
};
