import {
import {
  getServer,
  CONTRACT_ID,
  invokeContract,
  queryContractData,
  NETWORK_PASSPHRASE,
} from "./soroban";
import { getAddress } from "@stellar/freighter-api";
import { scValToNative } from "@stellar/stellar-sdk";

export interface StreamDetails {
  sender: string;
  receiver: string;
  token: string;
  totalAmount: bigint;
  startTime: number;
  endTime: number;
  withdrawn: bigint;
  createdAt: number;
  paused: boolean;
}

/**
 * Create a new continuous payment stream on-chain
 * @param sender - Funding source address (will be authorized)
 * @param receiver - Initial recipient address
 * @param token - SAC token contract address
 * @param amount - Total tokens to stream (in base units)
 * @param startTime - Stream start (Unix timestamp)
 * @param endTime - Stream end (Unix timestamp)
 * @returns Stream ID
 */
export async function createStream(
  sender: string,
  receiver: string,
  token: string,
  amount: bigint,
  startTime: number,
  endTime: number
): Promise<string> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured. Set NEXT_PUBLIC_CONTRACT_ID in .env");
    }

    // Invoke contract method with proper argument format
    const result = await invokeContract(sender, CONTRACT_ID, "create_stream", [
      { type: "Address", value: sender }, // sender
      { type: "Address", value: receiver }, // receiver
      { type: "Address", value: token }, // token
      { type: "i128", value: amount.toString() }, // amount
      { type: "u64", value: startTime.toString() }, // start_time
      { type: "u64", value: endTime.toString() }, // end_time
    ]);

    // Extract stream ID from result
    const streamId = scValToNative(result);
    if (!streamId) {
      throw new Error("No stream ID returned from contract");
    }

    return streamId.toString();
  } catch (error: any) {
    console.error("Error creating stream:", error);
    throw new Error(`Failed to create stream: ${error.message}`);
  }
}

/**
 * Withdraw available funds from a stream
 * @param streamId - ID of stream to withdraw from
 * @param to - Recipient address for withdrawal
 * @returns Amount withdrawn (in base units)
 */
export async function withdrawFromStream(streamId: string, to: string): Promise<bigint> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    const result = await invokeContract(userAddress, CONTRACT_ID, "withdraw", [
      { type: "u64", value: streamId },
      { type: "Address", value: to },
    ]);

    const amount = scValToNative(result);
    return BigInt(amount?.toString() || "0");
  } catch (error: any) {
    console.error("Error withdrawing from stream:", error);
    throw new Error(`Failed to withdraw: ${error.message}`);
  }
}

/**
 * Get complete stream details from contract
 * @param streamId - ID of stream to fetch
 * @returns Stream details including all fields
 */
export async function getStream(streamId: string): Promise<StreamDetails> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    const result = await invokeContract(userAddress, CONTRACT_ID, "get_stream", [
      { type: "u64", value: streamId },
    ]);

    const streamData = scValToNative(result);

    if (!streamData) {
      throw new Error("Stream not found");
    }

    return {
      sender: streamData.sender,
      receiver: streamData.receiver,
      token: streamData.token,
      totalAmount: BigInt(streamData.total_amount?.toString() || "0"),
      startTime: parseInt(streamData.start_time),
      endTime: parseInt(streamData.end_time),
      withdrawn: BigInt(streamData.withdrawn?.toString() || "0"),
      createdAt: parseInt(streamData.created_at),
      paused: streamData.paused || false,
    };
  } catch (error: any) {
    console.error("Error fetching stream:", error);
    throw new Error(`Failed to fetch stream: ${error.message}`);
  }
}

/**
 * Calculate available balance for withdrawal (local calculation)
 * Uses contract data to determine claimable amount
 */
export async function getAvailableBalance(streamId: string): Promise<bigint> {
  try {
    const userAddress = await getAddress();

    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const result = await invokeContract(userAddress, CONTRACT_ID, "get_available_balance", [
      { type: "u64", value: streamId },
    ]);

    const balance = scValToNative(result);
    return BigInt(balance?.toString() || "0");
  } catch (error: any) {
    console.error("Error calculating available balance:", error);
    throw new Error(`Failed to calculate balance: ${error.message}`);
  }
}

/**
 * Cancel a stream (sender only)
 * Calculates refund to sender and remaining for receiver
 */
export async function cancelStream(streamId: string): Promise<void> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    await invokeContract(userAddress, CONTRACT_ID, "cancel_stream", [
      { type: "u64", value: streamId },
    ]);
  } catch (error: any) {
    console.error("Error cancelling stream:", error);
    throw new Error(`Failed to cancel stream: ${error.message}`);
  }
}

/**
 * Pause a stream (sender only)
 * Prevents withdrawals until resumed
 */
export async function pauseStream(streamId: string): Promise<void> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    await invokeContract(userAddress, CONTRACT_ID, "pause_stream", [
      { type: "u64", value: streamId },
    ]);
  } catch (error: any) {
    console.error("Error pausing stream:", error);
    throw new Error(`Failed to pause stream: ${error.message}`);
  }
}

/**
 * Resume a paused stream (sender only)
 */
export async function resumeStream(streamId: string): Promise<void> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    await invokeContract(userAddress, CONTRACT_ID, "resume_stream", [
      { type: "u64", value: streamId },
    ]);
  } catch (error: any) {
    console.error("Error resuming stream:", error);
    throw new Error(`Failed to resume stream: ${error.message}`);
  }
}

/**
 * Configure split routes for automatic fund distribution
 */
export async function configureSplitRoutes(
  routes: Array<{ recipient: string; percentage: number; active: boolean }>
): Promise<void> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    await invokeContract(userAddress, CONTRACT_ID, "configure_split_routes", [
      { type: "Address", value: userAddress },
      { type: "Vec", value: routes },
    ]);
  } catch (error: any) {
    console.error("Error configuring split routes:", error);
    throw new Error(`Failed to configure routes: ${error.message}`);
  }
}

/**
 * Get total stream count
 */
export async function getStreamCount(): Promise<number> {
  try {
    if (!CONTRACT_ID) {
      throw new Error("CONTRACT_ID not configured");
    }

    const userAddress = await getAddress();

    const result = await invokeContract(userAddress, CONTRACT_ID, "get_stream_count", []);

    const count = scValToNative(result);
    return parseInt(count?.toString() || "0");
  } catch (error: any) {
    console.error("Error fetching stream count:", error);
    throw new Error(`Failed to fetch stream count: ${error.message}`);
  }
}
