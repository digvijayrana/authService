jest.mock("nodemailer", () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn()
  })
}));

const nodemailer = require("nodemailer");
const emailService = require("../../src/services/emailService");

describe("EMAIL SERVICE TESTS", () => {

  const mockSendMail = nodemailer.createTransport().sendMail;

  test("Should send email successfully", async () => {
    mockSendMail.mockResolvedValueOnce("MAIL_SENT");

    await emailService.sendMail(
      "test@mail.com",
      "Test Subject",
      "Test Body"
    );

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "auth@vidyarthi.com",
      to: "test@mail.com",
      subject: "Test Subject",
      text: "Test Body"
    });
  });

  test("Should handle email sending failure", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP FAILED"));

    await expect(
      emailService.sendMail("x@test.com", "Fail", "Body")
    ).rejects.toThrow("SMTP FAILED");
  });

});
