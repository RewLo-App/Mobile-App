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
  network: string;
  requestTimeoutMs: number;
}

export interface ManagedWalletProvisioningInput {
  firstName: string;
  lastName: string;
  email: string;
  zipCode: string;
  idempotencyKey: string;
  existingAccountId?: string | null;
}

export interface ManagedWalletProvisioningResult {
  braleAccountId: string;
  braleWalletId: string;
  braleAddressId?: string;
  blockchainAddress: string;
  blockchainNetwork: string;
}

export class BraleApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: "provider_unavailable" | "provider_rejected" | "provider_timeout",
    public readonly requestId: string,
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
      apiUrl: config.apiUrl ?? requiredEnv("BRALE_API_URL"),
      authUrl: config.authUrl ?? requiredEnv("BRALE_AUTH_URL"),
      stablecoin: config.stablecoin ?? process.env["BRALE_STABLECOIN"] ?? "SBC",
      network: config.network ?? requiredEnv("BRALE_NETWORK"),
      // Keep a provider outage from occupying an HTTP request indefinitely.
      requestTimeoutMs: config.requestTimeoutMs ?? timeoutFromEnv("BRALE_REQUEST_TIMEOUT_MS", 8_000),
    };
  }

  /** Verifies required server-only configuration without requesting a token. */
  static validateEnvironment() {
    new BraleService();
  }

  /**
   * Creates (once) a Brale managed account and selects its auto-created
   * internal custodial address for the configured network. Brale models an
   * internal wallet as an Address, so address ID is also the wallet ID unless
   * a future provider response exposes a distinct wallet_id.
   */
  async provisionManagedWallet(input: ManagedWalletProvisioningInput): Promise<ManagedWalletProvisioningResult> {
    let accountId = input.existingAccountId ?? undefined;
    if (!accountId) {
      const account = asObject(await this.request("/accounts", {
        method: "POST",
        headers: { "Idempotency-Key": input.idempotencyKey },
        body: JSON.stringify(this.managedAccountRequest(input)),
      }));
      if (typeof account["id"] !== "string") {
        throw new BraleApiError("Brale did not return an account identifier.", 502, "provider_rejected", randomUUID());
      }
      accountId = account["id"];
    }

    const response = asObject(await this.request(
      `/accounts/${encodeURIComponent(accountId)}/addresses`,
      { method: "GET" },
      true,
    ));
    const addresses = Array.isArray(response["addresses"]) ? response["addresses"] : [];
    for (const value of addresses) {
      const address = asObject(value);
      const transferTypes = Array.isArray(address["transfer_types"])
        ? address["transfer_types"].filter((type): type is string => typeof type === "string")
        : [];
      if (typeof address["id"] !== "string" || typeof address["address"] !== "string" || !transferTypes.includes(this.config.network)) continue;
      const walletId = typeof address["wallet_id"] === "string" ? address["wallet_id"] : address["id"];
      return {
        braleAccountId: accountId,
        braleWalletId: walletId,
        braleAddressId: address["id"],
        blockchainAddress: address["address"],
        blockchainNetwork: this.config.network,
      };
    }
    throw new BraleApiError("No compatible custodial address is available.", 502, "provider_rejected", randomUUID());
  }

  /**
   * Brale provisions internal custodial Addresses for an Account. For platform
   * custody, select the configured Solana testnet Address; no user wallet is created.
   */
  /** Returns the platform's active internal custodial address for the configured network. */
  async getPlatformCustodialAddress() {
    const response = asObject(await this.request(
      `/accounts/${encodeURIComponent(this.config.accountId)}/addresses`,
      { method: "GET" },
      true,
    ));
    const addresses = Array.isArray(response["addresses"]) ? response["addresses"] : [];
    for (const value of addresses) {
      const address = asObject(value);
      const transferTypes = Array.isArray(address["transfer_types"])
        ? address["transfer_types"].filter((type): type is string => typeof type === "string")
        : [];
      if (
        typeof address["id"] === "string"
        && typeof address["address"] === "string"
        && transferTypes.includes(this.config.network)
      ) {
        return {
          braleAccountId: this.config.accountId,
          braleAddressId: address["id"],
          blockchainAddress: address["address"],
          blockchainNetwork: this.config.network,
        };
      }
    }
    throw new BraleApiError(
      `No active platform custodial address supports ${this.config.network}. Enable that network for the Brale account or configure a supported network.`,
      502,
      "provider_rejected",
      randomUUID(),
    );
  }

  private managedAccountRequest(input: ManagedWalletProvisioningInput): JsonObject {
    const template = process.env["BRALE_MANAGED_ACCOUNT_TEMPLATE_JSON"];
    if (!template) {
      throw new BraleApiError("Managed-account provisioning is not configured.", 503, "provider_unavailable", randomUUID());
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(template) as unknown;
    } catch {
      throw new BraleApiError("Managed-account provisioning is not configured.", 503, "provider_unavailable", randomUUID());
    }
    const request = asObject(parsed);
    // Account creation requires compliance-approved KYC/KYB data which is
    // intentionally server-side. Only ordinary registration identity fields
    // are populated from this request.
    return {
      ...request,
      name: `RewLo Fan ${input.firstName} ${input.lastName}`,
      email: input.email,
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
        transfer_type: input.transferType ?? this.config.network,
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
    const transferType = input.transferType ?? this.config.network;
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
        transfer_type: input.transferType ?? this.config.network,
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
      transfer_type: input.transferType ?? this.config.network,
    });
    const request = { addressId: input.addressId, query: Object.fromEntries(query) };
    return this.runOperation(
      { userId: input.userId, type: "balance_check", reference: randomUUID(), request },
      () => this.request(`/accounts/${encodeURIComponent(this.config.accountId)}/addresses/${encodeURIComponent(input.addressId)}/balance?${query}`, { method: "GET" }, true),
    );
  }

  async getTransactionStatus(input: { userId: number; transactionId: string }): Promise<unknown> {
    const request = { transactionId: input.transactionId };
    return this.runOperation(
      { userId: input.userId, type: "status_check", reference: randomUUID(), request },
      () => this.request(`/accounts/${encodeURIComponent(this.config.accountId)}/transfers/${encodeURIComponent(input.transactionId)}`, { method: "GET" }, true),
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
        ? { statusCode: error.statusCode, code: error.code, requestId: error.requestId }
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

  private async request(path: string, init: RequestInit = {}, retrySafe = false): Promise<unknown> {
    const token = await this.getAccessToken();
    const requestId = randomUUID();
    const url = `${this.config.apiUrl.replace(/\/$/, "")}${path}`;
    const attempts = retrySafe ? 2 : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetchWithTimeout(url, {
          ...init,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "X-Request-ID": requestId, ...init.headers },
        }, this.config.requestTimeoutMs);
        const data = await parseResponse(response);
        if (response.ok) return data;
        if (retrySafe && attempt === 0 && (response.status === 408 || response.status === 429 || response.status >= 500)) continue;
        throw new BraleApiError("Brale request was rejected.", response.status, response.status >= 500 ? "provider_unavailable" : "provider_rejected", requestId);
      } catch (error) {
        if (error instanceof BraleApiError) throw error;
        if (retrySafe && attempt === 0) continue;
        const timeout = error instanceof Error && error.name === "AbortError";
        throw new BraleApiError(timeout ? "Brale request timed out." : "Brale request is unavailable.", 502, timeout ? "provider_timeout" : "provider_unavailable", requestId);
      }
    }
    throw new BraleApiError("Brale request is unavailable.", 502, "provider_unavailable", requestId);
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now() + 60_000) return this.accessToken.value;
    const basic = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString("base64");
    const requestId = randomUUID();
    let response: Response;
    try {
      response = await fetchWithTimeout(this.config.authUrl, {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      }, this.config.requestTimeoutMs);
    } catch (error) {
      const timeout = error instanceof Error && error.name === "AbortError";
      throw new BraleApiError(
        timeout ? "Brale authentication timed out." : "Brale authentication is unavailable.",
        502,
        timeout ? "provider_timeout" : "provider_unavailable",
        requestId,
      );
    }
    const data = await parseResponse(response);
    if (!response.ok) throw new BraleApiError("Brale authentication failed", response.status, response.status >= 500 ? "provider_unavailable" : "provider_rejected", requestId);
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

function timeoutFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  // A bounded, sane range prevents accidental values such as 0 or several
  // minutes from leaving an interactive payment action unresolved.
  return Number.isFinite(value) && value >= 1_000 && value <= 30_000 ? Math.floor(value) : fallback;
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

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export default BraleService;
