jest.mock("fs", () => ({
  readFileSync: jest.fn(() => "mocked-key")
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

const jwt = require("jsonwebtoken");
const jwtService = require("../../src/services/jwtService");
const fs = require("fs");

describe("JWT SERVICE TESTS", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should generate tenant token successfully", () => {
    jwt.sign.mockReturnValue("tenant-jwt-token");

    const token = jwtService.generateTenantToken({
      id: "U1",
      tenant_id: "T1",
      roles: ["TENANT_ADMIN"]
    });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(token).toBe("tenant-jwt-token");
  });

  test("Should generate super admin token successfully", () => {
    jwt.sign.mockReturnValue("super-admin-token");

    const token = jwtService.generateSuperAdminToken({
      id: "A1",
      roles: ["SUPER_ADMIN"]
    });

    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(token).toBe("super-admin-token");
  });

  test("Should verify token successfully", () => {
    jwt.verify.mockReturnValue({
      sub: "U1",
      roles: ["TENANT_ADMIN"]
    });

    const result = jwtService.verify("dummy-token");

    expect(jwt.verify).toHaveBeenCalledTimes(1);
    expect(result.sub).toBe("U1");
  });

  test("Should throw error when token verification fails", () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("INVALID TOKEN");
    });

    expect(() => jwtService.verify("bad-token")).toThrow("INVALID TOKEN");
  });

});
