jest.mock("../../src/config/db", () => ({
  query: jest.fn()
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

jest.mock("../../src/services/jwtService", () => ({
  generateTenantToken: jest.fn(() => "test-jwt-token")
}));

const pool = require("../../src/config/db");
const bcrypt = require("bcrypt");
const jwtService = require("../../src/services/jwtService");

const authService = require("../../src/services/authService");

// ---- Mock Response Object ----
const mockRes = () => {
  return {
    statusValue: null,
    jsonValue: null,
    status(code) {
      this.statusValue = code;
      return this;
    },
    json(obj) {
      this.jsonValue = obj;
      return this;
    }
  };
};

describe("AUTH SERVICE HIGH COVERAGE TESTS", () => {
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
  beforeEach(() => jest.clearAllMocks());

  // ---------------- LOGIN ----------------
  test("Login - validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await authService.login(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("VALIDATION_FAILED");
  });

  test("Login - user not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { email: "a@test.com", password: "123" } };
    const res = mockRes();

    await authService.login(req, res);

    expect(res.statusValue).toBe(404);
    expect(res.jsonValue.code).toBe("USER_NOT_FOUND");
  });

  test("Login - invalid password", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ password_hash: "hash" }]
    });

    bcrypt.compare.mockResolvedValueOnce(false);

    const req = { body: { email: "a@test.com", password: "123" } };
    const res = mockRes();

    await authService.login(req, res);

    expect(res.statusValue).toBe(401);
    expect(res.jsonValue.code).toBe("INVALID_PASSWORD");
  });

  test("Login - success", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: "1", password_hash: "hash" }]
    });

    bcrypt.compare.mockResolvedValueOnce(true);

    const req = { body: { email: "a@test.com", password: "123" } };
    const res = mockRes();

    await authService.login(req, res);

    expect(res.jsonValue.success).toBe(true);
    expect(res.jsonValue.data.token).toBe("test-jwt-token");
  });

  test("Login - server error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB failed"));

    const req = { body: { email: "a@test.com", password: "123" } };
    const res = mockRes();

    await authService.login(req, res);

    expect(res.statusValue).toBe(500);
    expect(res.jsonValue.code).toBe("SERVER_ERROR");
  });

  // ---------------- FORGOT PASSWORD ----------------
  test("Forgot - validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await authService.forgotPassword(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("VALIDATION_FAILED");
  });

  test("Forgot - user not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { email: "x@test.com" } };
    const res = mockRes();

    await authService.forgotPassword(req, res);

    expect(res.statusValue).toBe(404);
    expect(res.jsonValue.code).toBe("USER_NOT_FOUND");
  });

  test("Forgot - success", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: "1" }] })
      .mockResolvedValueOnce({});

    const req = { body: { email: "a@test.com" } };
    const res = mockRes();

    await authService.forgotPassword(req, res);

    expect(res.jsonValue.message).toBe("RESET_EMAIL_SENT");
  });

  test("Forgot - server error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB failed"));

    const req = { body: { email: "a@test.com" } };
    const res = mockRes();

    await authService.forgotPassword(req, res);

    expect(res.statusValue).toBe(500);
  });

  // ---------------- RESET PASSWORD ----------------
  test("Reset - validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await authService.resetPassword(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Reset - invalid token", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { token: "abc", newPassword: "123" } };
    const res = mockRes();

    await authService.resetPassword(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("TOKEN_INVALID_OR_EXPIRED");
  });

  test("Reset - success", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: "1", user_id: "1" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    bcrypt.hash.mockResolvedValueOnce("hashed");

    const req = { body: { token: "abc", newPassword: "123456" } };
    const res = mockRes();

    await authService.resetPassword(req, res);

    expect(res.jsonValue.message).toBe("PASSWORD_RESET_SUCCESS");
  });

  test("Reset - server error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB failed"));

    const req = { body: { token: "abc", newPassword: "123" } };
    const res = mockRes();

    await authService.resetPassword(req, res);

    expect(res.statusValue).toBe(500);
  });

  // ---------------- SET PASSWORD ----------------
  test("Set Password - validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await authService.setPassword(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Set Password - invalid token", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { token: "abc", newPassword: "123" } };
    const res = mockRes();

    await authService.setPassword(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Set Password - success", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: "1", user_id: "1" }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    bcrypt.hash.mockResolvedValueOnce("hashed");

    const req = { body: { token: "abc", newPassword: "123456" } };
    const res = mockRes();

    await authService.setPassword(req, res);

    expect(res.jsonValue.message).toBe("PASSWORD_SET_SUCCESS");
  });

  test("Set Password - server error", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB failed"));

    const req = { body: { token: "abc", newPassword: "123" } };
    const res = mockRes();

    await authService.setPassword(req, res);

    expect(res.statusValue).toBe(500);
  });

});
