import { randomUUID } from "node:crypto";
import { db, walletTransactionsTable } from "@workspace/db";

type JsonObject = Record<string, unknown>;
type TransactionType =
  | "mint"
  | "transfer"
  | "redeem"
  | "balance_check"
  | "status_check";
type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface Money {
  value: string;
  currency?: string;
}

export interface TransferEndpoint {
  address_id?: string;
  value_type: string;
  transfer_type: string;
}

interface OperationContext {
  userId: number;
  type: TransactionType;
  reference: string;
  amount?: Money;
  request: JsonObject;
}

interface BraleConfig {
  clientId: string;
  clientSecret: string;
  accountId: string;
  apiUrl: string;
  authUrl: string;
  stablecoin: string;
  transferType: string;
}

export class BraleApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response: unknown,
  ) {
    super(message);
    this.name = "BraleApiError";
  }
}

/** Server-only client for Brale's sandbox/testnet transfer API. */
export class BraleService {
  private readonly config: BraleConfig;
  private accessToken?: { value: string; expiresAt: number };

  constructor(config: Partial<BraleConfig> = {}) {
    this.config = {
      clientId: config.clientId ?? requiredEnv("BRALE_CLIENT_ID"),
      clientSecret: config.clientSecret ?? requiredEnv("BRALE_CLIENT_SECRET"),
      accountId: config.accountId ?? requiredEnv("BRALE_ACCOUNT_ID"),
      apiUrl: config.apiUrl ?? process.env["BRALE_API_URL"] ?? "https://api.brale.xyz",
      authUrl: config.authUrl ?? process.env["BRALE_AUTH_URL"] ?? "https://auth.brale.xyz/oauth2/token",
      stablecoin: config.stablecoin ?? process.env["BRALE_STABLECOIN"] ?? "SBC",
      transferType:
        config.transferType ?? process.env["BRALE_TESTNET_TRANSFER_TYPE"] ?? "solana_devnet",
    };
  }

  async mintStablecoin(input: {
    userId: number;
    destinationAddressId: string;
    amount: Money;
    stablecoin?: string;
    transferType?: string;
    idempotencyKey?: string;
  }): Promise<unknown> {
    const reference = input.idempotencyKey ?? randomUUID();
    const body = {
      amount: normalizeMoney(input.amount),
      source: { value_type: "USD", transfer_type: "wire" },
      destination: {
        address_id: input.destinationAddressId,
        value_type: input.stablecoin ?? this.config.stablecoin,
        transfer_type: input.transferType ?? this.config.transferType,
      },
    };
    return this.runTransfer({ userId: input.userId, type: "mint", reference, amount: body.amount, request: body }, body);
  }

  async transferStablecoin(input: {
    userId: number;
    sourceAddressId: string;
    destinationAddressId: string;
    amount: Money;
    stablecoin?: string;
    transferType?: string;
    destinationStablecoin?: string;
    destinationTransferType?: string;
    idempotencyKey?: string;
  }): Promise<unknown> {
    const reference = input.idempotencyKey ?? randomUUID();
    const valueType = input.stablecoin ?? this.config.stablecoin;
    const transferType = input.transferType ?? this.config.transferType;
    const body = {
      amount: normalizeMoney(input.amount),
      source: { address_id: input.sourceAddressId, value_type: valueType, transfer_type: transferType },
      destination: {
        address_id: input.destinationAddressId,
        value_type: input.destinationStablecoin ?? valueType,
        transfer_type: input.destinationTransferType ?? transferType,
      },
    };
    return this.runTransfer({ userId: input.userId, type: "transfer", reference, amount: body.amount, request: body }, body);
  }

  async redeemStablecoin(input: {
    userId: number;
    sourceAddressId: string;
    amount: Money;
    stablecoin?: string;
    transferType?: string;
    destinationAddressId?: string;
    destinationTransferType?: string;
    idempotencyKey?: string;
  }): Promise<unknown> {
    const reference = input.idempotencyKey ?? randomUUID();
    const destination: TransferEndpoint = {
      value_type: "USD",
      transfer_type: input.destinationTransferType ?? "wire",
    };
    if (input.destinationAddressId) destination.address_id = input.destinationAddressId;
    const body = {
      amount: normalizeMoney(input.amount),
      source: {
        address_id: input.sourceAddressId,
        value_type: input.stablecoin ?? this.config.stablecoin,
        transfer_type: input.transferType ?? this.config.transferType,
      },
      destination,
    };
    return this.runTransfer({ userId: input.userId, type: "redeem", reference, amount: body.amount, request: body }, body);
  }

  async getWalletBalance(input: {
    userId: number;
    addressId: string;
    stablecoin?: string;
    transferType?: string;
  }): Promise<unknown> {
    const query = new URLSearchParams({
      value_type: input.stablecoin ?? this.config.stablecoin,
      transfer_type: input.transferType ?? this.config.transferType,
    });
    const request = { addressId: input.addressId, query: Object.fromEntries(query) };
    return this.runOperation(
      { userId: input.userId, type: "balance_check", reference: randomUUID(), request },
      () => this.request(`/accounts/${encodeURIComponent(this.config.accountId)}/addresses/${encodeURIComponent(input.addressId)}/balance?${query}`),
    );
  }

  async getTransactionStatus(input: { userId: number; transactionId: string }): Promise<unknown> {
    const request = { transactionId: input.transactionId };
    return this.runOperation(
      { userId: input.userId, type: "status_check", reference: randomUUID(), request },
      () => this.request(`/accounts/${encodeURIComponent(this.config.accountId)}/transfers/${encodeURIComponent(input.transactionId)}`),
    );
  }

  private runTransfer(context: OperationContext, body: JsonObject): Promise<unknown> {
    return this.runOperation(context, () =>
      this.request(`/accounts/${encodeURIComponent(this.config.accountId)}/transfers`, {
        method: "POST",
        headers: { "Idempotency-Key": context.reference },
        body: JSON.stringify(body),
      }),
    );
  }

  private async runOperation(context: OperationContext, operation: () => Promise<unknown>): Promise<unknown> {
    try {
      const response = await operation();
      await this.storeResponse(context, response, responseStatus(response));
      return response;
    } catch (error) {
      const response = error instanceof BraleApiError
        ? { statusCode: error.statusCode, body: error.response }
        : { error: error instanceof Error ? error.message : "Unknown Brale error" };
      await this.storeResponse(context, response, "failed");
      throw error;
    }
  }

  private async storeResponse(context: OperationContext, response: unknown, status: TransactionStatus): Promise<void> {
    const result = asObject(response);
    const amount = context.amount ?? asMoney(result["balance"]) ?? asMoney(result["amount"]);
    await db.insert(walletTransactionsTable).values({
      userId: context.userId,
      type: context.type,
      status,
      amountCents: amount ? toCents(amount.value) : 0,
      currency: amount?.currency ?? "USD",
      reference: context.reference,
      externalTransactionId: typeof result["id"] === "string" ? result["id"] : null,
      blockchainHash: extractHash(result),
      description: `Brale ${context.type.replace("_", " ")}`,
      metadata: { provider: "brale", environment: "testnet", request: context.request, response },
    });
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.config.apiUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
    });
    const data = await parseResponse(response);
    if (!response.ok) throw new BraleApiError(`Brale request failed with HTTP ${response.status}`, response.status, data);
    return data;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) return this.accessToken.value;
    const basic = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64");
    const response = await fetch(this.config.authUrl, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    const data = await parseResponse(response);
    if (!response.ok) throw new BraleApiError("Brale authentication failed", response.status, data);
    const auth = asObject(data);
    if (typeof auth["access_token"] !== "string") throw new Error("Brale authentication response did not include access_token");
    const expiresIn = typeof auth["expires_in"] === "number" ? auth["expires_in"] : 3600;
    this.accessToken = { value: auth["access_token"], expiresAt: Date.now() + expiresIn * 1000 };
    return this.accessToken.value;
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set on the Node.js backend`);
  return value;
}

function normalizeMoney(money: Money): Required<Money> {
  if (!/^\d+(\.\d{1,2})?$/.test(money.value) || Number(money.value) <= 0) {
    throw new Error("amount.value must be a positive decimal string with at most two decimal places");
  }
  return { value: money.value, currency: money.currency ?? "USD" };
}

function toCents(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error("Amount is outside the supported range");
  return cents;
}

function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function asMoney(value: unknown): Money | undefined {
  const object = asObject(value);
  return typeof object["value"] === "string"
    ? { value: object["value"], currency: typeof object["currency"] === "string" ? object["currency"] : "USD" }
    : undefined;
}

function responseStatus(value: unknown): TransactionStatus {
  const status = asObject(value)["status"];
  if (status === "completed" || status === "complete" || status === "succeeded") return "completed";
  if (status === "failed" || status === "rejected" || status === "canceled" || status === "cancelled") return "failed";
  if (status === "reversed") return "reversed";
  return "pending";
}

function extractHash(value: JsonObject): string | null {
  for (const key of ["blockchain_hash", "transaction_hash", "tx_hash"]) {
    if (typeof value[key] === "string") return value[key];
  }
  return null;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as unknown; } catch { return { raw: text }; }
}

export default BraleService;
