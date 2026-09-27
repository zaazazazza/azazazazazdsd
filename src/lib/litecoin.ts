const LITECOIN_SPACE_BASE = "https://litecoinspace.org/api";

export type LitecoinVerification = {
  valid: boolean;
  txid: string;
  amountReceived: number;
  addressMatched: boolean;
  confirmations: number;
  status: "confirmed" | "mempool" | "invalid";
};

type LitecoinTransaction = {
  txid?: string;
  vout?: Array<{
    value?: number;
    scriptpubkey_address?: string;
  }>;
  status?: {
    confirmed?: boolean;
    block_height?: number;
    block_hash?: string;
  };
};

function getBaseUrl() {
  return process.env.LITECOIN_SPACE_API_URL ?? LITECOIN_SPACE_BASE;
}

export function isLitecoinReady(): boolean {
  return Boolean(
    process.env.LTC_PAYMENT_ADDRESS ||
      process.env.LTC_PAYMENT_ADDRESS_POOL ||
      process.env.LTC_XPUB,
  );
}

export function nextPaymentAddress(): string | null {
  const pool = (process.env.LTC_PAYMENT_ADDRESS_POOL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  }

  return process.env.LTC_PAYMENT_ADDRESS?.trim() || null;
}

export async function verifyLitecoinTransaction(
  txid: string,
  expectedAddress: string,
  expectedAmount: number,
): Promise<LitecoinVerification> {
  if (!/^[a-fA-F0-9]{64}$/.test(txid)) {
    return {
      valid: false,
      txid,
      amountReceived: 0,
      addressMatched: false,
      confirmations: 0,
      status: "invalid",
    };
  }

  const response = await fetch(`${getBaseUrl()}/tx/${txid}`, {
    signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "SicarioShopBot/1.0" },
  });

  if (response.status === 404) {
    return {
      valid: false,
      txid,
      amountReceived: 0,
      addressMatched: false,
      confirmations: 0,
      status: "invalid",
    };
  }

  if (!response.ok) {
    throw new Error(`Litecoin Space responded with HTTP ${response.status}`);
  }

  const transaction = (await response.json()) as LitecoinTransaction;
  const outputs = Array.isArray(transaction.vout) ? transaction.vout : [];
  const matchingOutputs = outputs.filter(
    (output) => output.scriptpubkey_address === expectedAddress,
  );
  const amountReceived =
    matchingOutputs.reduce((total, output) => total + Number(output.value ?? 0), 0) /
    100_000_000;
  const confirmed = transaction.status?.confirmed === true;

  let confirmations = 0;
  if (confirmed && transaction.status?.block_height) {
    const tipResponse = await fetch(`${getBaseUrl()}/blocks/tip/height`, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "SicarioShopBot/1.0" },
    });
    if (tipResponse.ok) {
      const tipHeight = Number(await tipResponse.text());
      confirmations = Math.max(
        0,
        tipHeight - transaction.status.block_height + 1,
      );
    }
  }

  return {
    valid: Boolean(transaction.txid === txid && matchingOutputs.length > 0),
    txid,
    amountReceived,
    addressMatched: matchingOutputs.length > 0,
    confirmations,
    status: confirmed ? "confirmed" : "mempool",
  };
}