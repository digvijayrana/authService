jest.mock("../../src/services/jwtService", () => ({
  verify: jest.fn()
}));

// mute logger
jest.mock("../../src/logger", () =>
  () =>
    ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })
);

const jwtService = require("../../src/services/jwtService");
const authMiddleware = require("../../src/middleware/authMiddleware");

// Mock res
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

describe("AUTH MIDDLEWARE TESTS", () => {
  beforeEach(() => jest.clearAllMocks());

  // ----------- 1️⃣ Missing Token -----------
  test("Should return 401 when no token provided", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.statusValue).toBe(401);
    expect(res.jsonValue.message).toBe("Missing token");
    expect(next).not.toHaveBeenCalled();
  });

  // ----------- 2️⃣ Invalid Token -----------
  test("Should return 401 when token invalid", () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error("BAD TOKEN");
    });

    const req = {
      headers: { authorization: "Bearer badtoken" }
    };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.statusValue).toBe(401);
    expect(res.jsonValue.message).toBe("Invalid token");
    expect(next).not.toHaveBeenCalled();
  });

  // ----------- 3️⃣ Valid Token -----------
  test("Should verify token and call next()", () => {
    jwtService.verify.mockReturnValue({
      id: "U1",
      roles: ["SUPER_ADMIN"]
    });

    const req = {
      headers: { authorization: "Bearer validtoken" }
    };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(jwtService.verify).toHaveBeenCalledWith("validtoken");
    expect(req.user.id).toBe("U1");
    expect(next).toHaveBeenCalledTimes(1);
  });
});
