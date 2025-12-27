jest.mock("twilio", () => {
  const mockCreate = jest.fn();
  const mockMessages = { create: mockCreate };

  const mockClient = {
    messages: mockMessages
  };

  return () => mockClient;
});

const smsService = require("../../src/services/smsService");
const twilio = require("twilio");

describe("SMS SERVICE TESTS", () => {
  const mockClient = twilio();
  const mockCreate = mockClient.messages.create;

  beforeEach(() => jest.clearAllMocks());

  test("Should send SMS successfully", async () => {
    mockCreate.mockResolvedValueOnce("SMS_SENT");

    await smsService.sendSms("+911111111111", "Test message");

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith({
      body: "Test message",
      from: process.env.TWILIO_FROM,
      to: "+911111111111"
    });
  });

  test("Should handle SMS send failure", async () => {
    mockCreate.mockRejectedValueOnce(new Error("TWILIO_FAILED"));

    await expect(
      smsService.sendSms("+911111111111", "Fail message")
    ).rejects.toThrow("TWILIO_FAILED");
  });
});
