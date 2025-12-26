jest.mock("../../src/config/db", () => ({
  query: jest.fn()
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn()
}));

jest.mock("../../src/services/jwtService", () => ({
  generateSuperAdminToken: jest.fn(() => "super-admin-token")
}));

// mute logger
jest.mock("../../src/logger", () =>
  () =>
    ({
      info: jest.fn(),
      error: jest.fn()
    })
);

const pool = require("../../src/config/db");
const bcrypt = require("bcrypt");
const jwtService = require("../../src/services/jwtService");
const otpService = require("../../src/services/otpService");

const crypto = require("crypto");
const hash = v => crypto.createHash("sha256").update(v).digest("hex");

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

describe("OTP SERVICE HIGH COVERAGE TESTS", () => {
  beforeEach(() => jest.clearAllMocks());

  // ---------------- MOBILE VERIFY REQUEST ----------------
  test("Mobile verify request validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await otpService.mobileVerifyRequest(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("VALIDATION_FAILED");
  });

  test("Mobile verify request success", async () => {
    pool.query.mockResolvedValueOnce({});

    const req = { body: { mobile: "+9199999999" } };
    const res = mockRes();

    await otpService.mobileVerifyRequest(req, res);

    expect(res.jsonValue.success).toBe(true);
  });

  // ---------------- MOBILE VERIFY CONFIRM ----------------
  test("Mobile verify confirm invalid", async () => {
    const req = { body: {} };
    const res = mockRes();

    await otpService.mobileVerifyConfirm(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("VALIDATION_FAILED");
  });

  test("Mobile verify confirm OTP expired", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { mobile: "+91", otp: "123456" } };
    const res = mockRes();

    await otpService.mobileVerifyConfirm(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("OTP_INVALID_OR_EXPIRED");
  });

  test("Mobile verify confirm success", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [
          { otp_hash: hash("123456"), user_id: "U1" }
        ]
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const req = { body: { mobile: "+91", otp: "123456" } };
    const res = mockRes();

    await otpService.mobileVerifyConfirm(req, res);

    expect(res.jsonValue.message).toBe("MOBILE_VERIFIED");
  });

  // ---------------- PASSWORD OTP REQUEST ----------------
  test("Password OTP request validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await otpService.passwordOtpRequest(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Password OTP request user not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { mobile: "+91" } };
    const res = mockRes();

    await otpService.passwordOtpRequest(req, res);

    expect(res.statusValue).toBe(404);
    expect(res.jsonValue.code).toBe("USER_NOT_FOUND");
  });

  test("Password OTP request mobile not verified", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: "1", mobile_verified: false }]
    });

    const req = { body: { mobile: "+91" } };
    const res = mockRes();

    await otpService.passwordOtpRequest(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("MOBILE_NOT_VERIFIED");
  });

  test("Password OTP request success", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: "1", mobile_verified: true }]
      })
      .mockResolvedValueOnce({});

    const req = { body: { mobile: "+91" } };
    const res = mockRes();

    await otpService.passwordOtpRequest(req, res);

    expect(res.jsonValue.success).toBe(true);
  });

  // ---------------- PASSWORD OTP VERIFY ----------------
  test("Password OTP verify validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await otpService.passwordOtpVerify(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Password OTP verify expired", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { mobile: "+91", otp: "123", newPassword: "x" } };
    const res = mockRes();

    await otpService.passwordOtpVerify(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("OTP_INVALID_OR_EXPIRED");
  });

  test("Password OTP verify invalid", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ otp_hash: "wrong" }]
    });

    const req = { body: { mobile: "+91", otp: "123", newPassword: "x" } };
    const res = mockRes();

    await otpService.passwordOtpVerify(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("OTP_INVALID");
  });

  test("Password OTP verify success", async () => {
    bcrypt.hash.mockResolvedValueOnce("hashed-password");

    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: "OTP1", user_id: "U1", otp_hash: hash("123456") }]
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const req = { body: { mobile: "+91", otp: "123456", newPassword: "abc" } };
    const res = mockRes();

    await otpService.passwordOtpVerify(req, res);

    expect(res.jsonValue.message).toBe("PASSWORD_RESET_SUCCESS");
  });

  // ---------------- SUPER ADMIN REQUEST ----------------
  test("Super admin request validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await otpService.superAdminOtpRequest(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Super admin not found", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { mobile: "+91" } };
    const res = mockRes();

    await otpService.superAdminOtpRequest(req, res);

    expect(res.statusValue).toBe(404);
  });

  test("Super admin OTP request success", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: "1" }] })
      .mockResolvedValueOnce({});

    const req = { body: { mobile: "+91" } };
    const res = mockRes();

    await otpService.superAdminOtpRequest(req, res);

    expect(res.jsonValue.success).toBe(true);
  });

  // ---------------- SUPER ADMIN VERIFY ----------------
  test("Super admin verify validation failed", async () => {
    const req = { body: {} };
    const res = mockRes();

    await otpService.superAdminOtpVerify(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Super admin OTP expired", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const req = { body: { mobile: "+91", otp: "123" } };
    const res = mockRes();

    await otpService.superAdminOtpVerify(req, res);

    expect(res.statusValue).toBe(400);
  });

  test("Super admin OTP invalid", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ otp_hash: "wrong" }]
    });

    const req = { body: { mobile: "+91", otp: "123" } };
    const res = mockRes();

    await otpService.superAdminOtpVerify(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("OTP_INVALID");
  });

  test("Super admin OTP verify success", async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: "1", otp_hash: hash("123456") }]
      })
      .mockResolvedValueOnce({});

    const req = { body: { mobile: "+91", otp: "123456" } };
    const res = mockRes();

    await otpService.superAdminOtpVerify(req, res);

    expect(res.jsonValue.success).toBe(true);
    expect(res.jsonValue.token).toBe("super-admin-token");
  });
});
