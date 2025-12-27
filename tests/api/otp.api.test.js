const request = require("supertest");
const app = require("../../src/app");

describe("OTP API", () => {

  test("Mobile verify request without mobile should fail", async () => {
    const res = await request(app)
      .post("/auth/mobile/verify/request")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_FAILED");
  });

});
