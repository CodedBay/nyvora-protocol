export interface Stream {
  id: u64;
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

export interface SplitRoute {
  percentage: number;
  recipient: string;
  active: boolean;
}

export interface SplitRouter {
  owner: string;
  routes: SplitRoute[];
  routeCount: number;
}

export interface CreateStreamInput {
  receiver: string;
  token: string;
  amount: bigint;
  startTime: number;
  endTime: number;
}

export interface WithdrawInput {
  streamId: u64;
  to: string;
}

export interface ContractConfig {
  contractId: string;
  network: string;
  rpcUrl: string;
  networkPassphrase: string;
}
