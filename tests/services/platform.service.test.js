jest.mock("../../src/config/db", () => ({
  query: jest.fn()
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

const pool = require("../../src/config/db");
const platformService = require("../../src/services/platformService");

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

describe("PLATFORM SERVICE - CREATE TENANT HIGH COVERAGE", () => {
  beforeEach(() => jest.clearAllMocks());

  // ----------- 1️⃣ Forbidden -----------
  test("Should block non SUPER_ADMIN", async () => {
    const req = { user: { roles: ["TENANT_ADMIN"] }, body: {} };
    const res = mockRes();

    await platformService.createTenant(req, res);

    expect(res.statusValue).toBe(403);
    expect(res.jsonValue.code).toBe("FORBIDDEN");
  });

  // ----------- 2️⃣ Validation Failed -----------
  test("Should fail validation when fields missing", async () => {
    const req = { user: { roles: ["SUPER_ADMIN"] }, body: {} };
    const res = mockRes();

    await platformService.createTenant(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("VALIDATION_FAILED");
  });

  // ----------- 3️⃣ Success -----------
  test("Should create tenant successfully", async () => {
    pool.query
      .mockResolvedValueOnce({})  // BEGIN
      .mockResolvedValueOnce({})  // insert tenant
      .mockResolvedValueOnce({})  // insert user
      .mockResolvedValueOnce({})  // insert role
      .mockResolvedValueOnce({}); // COMMIT

    const req = {
      user: { roles: ["SUPER_ADMIN"] },
      body: {
        tenantName: "DPS",
        adminFullName: "Admin",
        adminEmail: "a@test.com",
        adminMobile: "+91111111"
      }
    };

    const res = mockRes();

    await platformService.createTenant(req, res);

    expect(pool.query).toHaveBeenCalled();
    expect(res.jsonValue.success).toBe(true);
    expect(res.jsonValue.message).toBe("TENANT_CREATED");
  });

  // ----------- 4️⃣ Duplicate Tenant Error -----------
  test("Should handle duplicate tenant (23505)", async () => {
    pool.query.mockRejectedValueOnce({ code: "23505" });

    const req = {
      user: { roles: ["SUPER_ADMIN"] },
      body: {
        tenantName: "DPS",
        adminFullName: "Admin",
        adminEmail: "a@test.com",
        adminMobile: "+91111111"
      }
    };

    const res = mockRes();

    await platformService.createTenant(req, res);

    expect(res.statusValue).toBe(400);
    expect(res.jsonValue.code).toBe("DUPLICATE_ENTRY");
  });

  // ----------- 5️⃣ Generic Server Error + Rollback -----------
  test("Should handle server error & rollback", async () => {
    pool.query
      .mockResolvedValueOnce({})      // BEGIN
      .mockRejectedValueOnce(new Error("DB crash")); // first insert fails

    const req = {
      user: { roles: ["SUPER_ADMIN"] },
      body: {
        tenantName: "DPS",
        adminFullName: "Admin",
        adminEmail: "a@test.com",
        adminMobile: "+91111111"
      }
    };

    const res = mockRes();

    await platformService.createTenant(req, res);

    expect(pool.query).toHaveBeenCalled();
    expect(res.statusValue).toBe(500);
    expect(res.jsonValue.code).toBe("SERVER_ERROR");
  });
});
