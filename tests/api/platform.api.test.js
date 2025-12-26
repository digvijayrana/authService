const request = require("supertest");
const app = require("../../src/app");

describe("TENANT PLATFORM API", () => {

  test("Create tenant without auth should fail", async () => {
    const res = await request(app)
      .post("/platform/tenants")
      .send({});

    expect(res.status).toBe(401);
  });

});
