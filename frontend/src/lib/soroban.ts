import {
  SorobanRpc,
  TransactionBuilder,
  Account,
  Operation,
  BASE_FEE,
  xdr,
  StrKey,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";

export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID || "";

let server: SorobanRpc.Server | null = null;

/**
 * Get or create Soroban RPC server connection
 */
export function getServer(): SorobanRpc.Server {
  if (!server) {
    server = new SorobanRpc.Server(RPC_URL, {
      allowHttp: RPC_URL.startsWith("http://"),
    });
  }
  return server;
}

/**
 * Get account details from network
 */
export async function getAccount(publicKey: string): Promise<Account> {
  try {
    const server = getServer();
    const account = await server.getAccount(publicKey);
    return account;
  } catch (error) {
    console.error("Error fetching account:", error);
    throw new Error("Failed to fetch account details");
  }
}

/**
 * Get account sequence number
 */
export async function getAccountSequence(publicKey: string): Promise<string> {
  try {
    const account = await getAccount(publicKey);
    return account.sequence;
  } catch (error) {
    console.error("Error fetching account sequence:", error);
    throw new Error("Failed to fetch account sequence");
  }
}

/**
 * Build and submit a contract invocation
 */
export async function invokeContract(
  publicKey: string,
  contractId: string,
  method: string,
  args: any[]
): Promise<any> {
  try {
    const server = getServer();

    if (!contractId) {
      throw new Error("CONTRACT_ID not configured");
    }

    // Get account for transaction
    const account = await getAccount(publicKey);

    // Build contract invocation operation
    const operation = Operation.invokeHostFunction({
      hostFunction: xdr.HostFunction.hostFunctionTypeInvokeContract(
        new xdr.InvokeContractArgs({
          contractAddress: xdr.SCAddress.scAddressTypeContract(
            StrKey.decodeContract(contractId)
          ),
          functionName: xdr.ScSymbol.native(method),
          args: xdr.ScVal.native(args),
        })
      ),
      auth: [],
    });

    // Create transaction
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get auth requirements
    const simResult = await server.simulateTransaction(tx);

    if (SorobanRpc.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    // Build final transaction with simulation results
    const finalTx = SorobanRpc.assembleTransaction(tx, simResult).build();

    // Sign with wallet
    const signedXdr = await signTransaction(finalTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    // Convert back to transaction
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

    // Submit transaction
    const response = await server.sendTransaction(signedTx);

    // Poll for result if pending
    if (response.status === "PENDING") {
      const result = await pollTransactionStatus(server, response.hash);
      return result;
    }

    return response;
  } catch (error: any) {
    console.error("Error invoking contract:", error);
    throw new Error(`Contract invocation failed: ${error.message}`);
  }
}

/**
 * Query contract data
 */
export async function queryContractData(
  contractId: string,
  key: string
): Promise<any> {
  try {
    const server = getServer();

    if (!contractId) {
      throw new Error("CONTRACT_ID not configured");
    }

    // Parse contract ID
    const contractBuffer = StrKey.decodeContract(contractId);
    const contractAddress = xdr.SCAddress.scAddressTypeContract(contractBuffer);

    // Create storage key
    const storageKey = xdr.LedgerKey.ledgerKeyContractData({
      contractId: contractAddress,
      key: xdr.ScVal.native(key),
      durability: xdr.ContractDataDurability.persistent(),
    });

    // Query ledger
    const contractData = await server.getLedgerEntries(storageKey);

    if (!contractData.entries || contractData.entries.length === 0) {
      return null;
    }

    // Parse result
    const entry = contractData.entries[0];
    if (!entry.val) {
      return null;
    }

    const contractDataXdr = entry.val.contractData();
    return scValToNative(contractDataXdr.val());
  } catch (error) {
    console.error("Error querying contract:", error);
    throw new Error("Failed to query contract data");
  }
}

/**
 * Submit a pre-signed transaction
 */
export async function submitTransaction(txXdr: string): Promise<string> {
  try {
    const server = getServer();
    const tx = TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE);

    const response = await server.sendTransaction(tx);

    if (response.status === "PENDING") {
      return await pollTransactionStatus(server, response.hash);
    }

    return response.hash;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    throw new Error("Failed to submit transaction");
  }
}

/**
 * Poll transaction status until complete
 */
export async function pollTransactionStatus(
  server: SorobanRpc.Server,
  hash: string,
  maxAttempts = 60
): Promise<string> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await server.getTransaction(hash);

      if (response.status === "SUCCESS") {
        return hash;
      } else if (response.status === "FAILED") {
        throw new Error("Transaction failed on network");
      }
    } catch (error: any) {
      if (error?.status !== 404 && !error.message.includes("Transaction not found")) {
        throw error;
      }
    }

    // Wait 1 second before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts++;
  }

  throw new Error("Transaction timeout after 60 seconds");
}

/**
 * Simulate a transaction without submitting
 */
export async function simulateTransaction(
  publicKey: string,
  operations: Operation[]
): Promise<SorobanRpc.SimulateTransactionResponse> {
  const server = getServer();

  try {
    const account = await getAccount(publicKey);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(...operations)
      .setTimeout(30)
      .build();

    return await server.simulateTransaction(tx);
  } catch (error) {
    console.error("Error simulating transaction:", error);
    throw new Error("Failed to simulate transaction");
  }
}

/**
 * Check if network is healthy
 */
export async function checkNetworkHealth(): Promise<boolean> {
  try {
    const server = getServer();
    const health = await server.getHealth();
    return health.status === "healthy";
  } catch (error) {
    console.error("Network health check failed:", error);
    return false;
  }
}
