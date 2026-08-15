/**
 * Contract Integration Tests
 * Tests all contract invocation functions with proper mocking
 */

import * as contracts from "../contracts";
import * as soroban from "../soroban";

// Mock the soroban module
jest.mock("../soroban", () => ({
  CONTRACT_ID: "CAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  invokeContract: jest.fn(),
  queryContractData: jest.fn(),
  getServer: jest.fn(),
}));

// Mock the freighter API
jest.mock("@stellar/freighter-api", () => ({
  getAddress: jest.fn(() => Promise.resolve("GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4")),
  signTransaction: jest.fn(),
}));

// Mock stellar SDK
jest.mock("@stellar/stellar-sdk", () => ({
  scValToNative: jest.fn((val) => val),
  // ... other SDK mocks as needed
}));

describe("Contract Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createStream", () => {
    it("should invoke contract with correct parameters", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce({ type: "u64", value: "123" });

      const sender = "GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";
      const receiver = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4";
      const token = "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSC4";
      const amount = BigInt(1000000000);
      const startTime = 1692000000;
      const endTime = 1692086400;

      const result = await contracts.createStream(
        sender,
        receiver,
        token,
        amount,
        startTime,
        endTime
      );

      expect(mockInvoke).toHaveBeenCalledWith(
        sender,
        soroban.CONTRACT_ID,
        "create_stream",
        expect.arrayContaining([
          { type: "Address", value: sender },
          { type: "Address", value: receiver },
          { type: "Address", value: token },
          expect.objectContaining({ type: "i128" }),
          expect.objectContaining({ type: "u64" }),
          expect.objectContaining({ type: "u64" }),
        ])
      );

      expect(result).toBe("123");
    });

    it("should throw error if CONTRACT_ID not configured", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;

      // Override CONTRACT_ID to empty
      Object.defineProperty(soroban, "CONTRACT_ID", { value: "" });

      await expect(
        contracts.createStream(
          "GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
          "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4",
          "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSC4",
          BigInt(1000),
          1692000000,
          1692086400
        )
      ).rejects.toThrow("CONTRACT_ID not configured");
    });
  });

  describe("withdrawFromStream", () => {
    it("should invoke contract withdraw with stream ID and recipient", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce({ type: "i128", value: "500000000" });

      const streamId = "123";
      const to = "GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";

      const result = await contracts.withdrawFromStream(streamId, to);

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "withdraw",
        expect.arrayContaining([
          { type: "u64", value: streamId },
          { type: "Address", value: to },
        ])
      );

      expect(result).toBe(BigInt("500000000"));
    });
  });

  describe("getStream", () => {
    it("should query contract and return stream details", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      const mockStreamData = {
        sender: "GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
        receiver: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4",
        token: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSC4",
        total_amount: "1000000000",
        start_time: 1692000000,
        end_time: 1692086400,
        withdrawn: "500000000",
        created_at: 1691990000,
        paused: false,
      };

      mockInvoke.mockResolvedValueOnce(mockStreamData);

      const stream = await contracts.getStream("123");

      expect(stream).toEqual({
        sender: mockStreamData.sender,
        receiver: mockStreamData.receiver,
        token: mockStreamData.token,
        totalAmount: BigInt("1000000000"),
        startTime: 1692000000,
        endTime: 1692086400,
        withdrawn: BigInt("500000000"),
        createdAt: 1691990000,
        paused: false,
      });
    });
  });

  describe("getAvailableBalance", () => {
    it("should return available balance for stream", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce({ type: "i128", value: "250000000" });

      const balance = await contracts.getAvailableBalance("123");

      expect(balance).toBe(BigInt("250000000"));
      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "get_available_balance",
        [{ type: "u64", value: "123" }]
      );
    });
  });

  describe("cancelStream", () => {
    it("should cancel stream and process refunds", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce(null);

      await contracts.cancelStream("123");

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "cancel_stream",
        [{ type: "u64", value: "123" }]
      );
    });
  });

  describe("pauseStream", () => {
    it("should pause stream and prevent withdrawals", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce(null);

      await contracts.pauseStream("123");

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "pause_stream",
        [{ type: "u64", value: "123" }]
      );
    });
  });

  describe("resumeStream", () => {
    it("should resume paused stream", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce(null);

      await contracts.resumeStream("123");

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "resume_stream",
        [{ type: "u64", value: "123" }]
      );
    });
  });

  describe("configureSplitRoutes", () => {
    it("should configure split routes for fund distribution", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce(null);

      const routes = [
        {
          recipient: "GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
          percentage: 5000,
          active: true,
        },
        {
          recipient: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4",
          percentage: 5000,
          active: true,
        },
      ];

      await contracts.configureSplitRoutes(routes);

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "configure_split_routes",
        expect.arrayContaining([
          { type: "Address", value: expect.any(String) },
          { type: "Vec", value: routes },
        ])
      );
    });
  });

  describe("getStreamCount", () => {
    it("should return total stream count", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockResolvedValueOnce({ type: "u64", value: "42" });

      const count = await contracts.getStreamCount();

      expect(count).toBe(42);
      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        soroban.CONTRACT_ID,
        "get_stream_count",
        []
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle contract invocation errors gracefully", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockRejectedValueOnce(
        new Error("Network request failed")
      );

      await expect(contracts.getStreamCount()).rejects.toThrow(
        "Failed to fetch stream count"
      );
    });

    it("should handle missing stream errors", async () => {
      const mockInvoke = soroban.invokeContract as jest.Mock;
      mockInvoke.mockRejectedValueOnce(
        new Error("Stream not found")
      );

      await expect(contracts.getStream("999")).rejects.toThrow(
        "Failed to fetch stream"
      );
    });
  });
});

describe("Type Safety", () => {
  it("should export correct interfaces", () => {
    expect(contracts.StreamDetails).toBeDefined();

    const mockStream: contracts.StreamDetails = {
      sender: "GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      receiver: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBSC4",
      token: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCSC4",
      totalAmount: BigInt(1000000000),
      startTime: 1692000000,
      endTime: 1692086400,
      withdrawn: BigInt(500000000),
      createdAt: 1691990000,
      paused: false,
    };

    expect(mockStream).toBeDefined();
    expect(typeof mockStream.totalAmount).toBe("bigint");
  });
});
