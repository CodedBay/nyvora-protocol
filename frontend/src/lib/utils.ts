export function shortenAddress(address: string | undefined, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

export function formatAmount(amount: bigint, decimals = 7): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return wholePart.toString();
  }
  
  return `${wholePart}.${fractionalPart.toString().padStart(decimals, "0")}`;
}

export function parseAmount(amount: string, decimals = 7): bigint {
  const parts = amount.split(".");
  const wholePart = BigInt(parts[0] || "0");
  const fractionalStr = (parts[1] || "").padEnd(decimals, "0").substring(0, decimals);
  const fractionalPart = BigInt(fractionalStr);
  
  return wholePart * BigInt(10 ** decimals) + fractionalPart;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatDatetime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function getTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = endTime - now;
  
  if (remaining <= 0) return "Stream ended";
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function getStreamProgress(startTime: number, endTime: number): number {
  const now = Math.floor(Date.now() / 1000);
  const total = endTime - startTime;
  const elapsed = Math.min(now - startTime, total);
  
  return (elapsed / total) * 100;
}

export function isStreamActive(startTime: number, endTime: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= startTime && now < endTime;
}

export function validateStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{56}$/.test(address);
}
