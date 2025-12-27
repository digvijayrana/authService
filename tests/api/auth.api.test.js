const request = require("supertest");
const app = require("../../src/app");

describe("AUTH API TESTS", () => {

  test("Login should fail when email missing", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_FAILED");
  });

  test("Login should fail when user not found", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "unknown@test.com",
        password: "123456"
      });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
  });

  test("Login API Success", async () => {
  const res = await request(app)
    .post("/auth/login")
    .send({
      email: "john.doe@school.com",
      password: "12345678"
    });

  expect(res.status).toBe(200);
});


});
