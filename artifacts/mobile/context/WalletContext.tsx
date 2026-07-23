import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { DEFAULT_CLUB_ID, getClubById } from "@/constants/clubs";
import {
  configureAuthClient,
  forgotPassword as requestPasswordReset,
  loginWithPassword,
  logoutSession,
  refreshAuthSession,
  registerAccount,
  resetPassword as submitPasswordReset,
  restoreAuthSession,
  setSessionExpiredHandler,
} from "@/utils/authSession";
import { walletRequest } from "@/utils/walletApi";
import type { CurrentUser, RegisterRequest } from "@workspace/api-client-react";

// Screen effects may run before WalletProvider's effect. Configure the API
// client at module load so the live offers request always has its base URL and
// bearer-token getter.
configureAuthClient();

export interface Transaction {
  id: string;
  type: "send" | "receive" | "payment" | "reward" | "topup";
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  status: "completed" | "pending" | "failed" | "reversed";
  clubTag?: string;
}

export interface VirtualCard {
  id: string;
  last4: string;
  brand: "visa" | "mastercard";
  expiryMonth: number;
  expiryYear: number;
  gradientStart: string;
  gradientEnd: string;
  clubName: string;
  isDefault: boolean;
  cardholderName: string;
}

export interface Offer {
  id: string;
  merchant: string;
  category: string;
  description: string;
  discount: string;
  pointsCost: number;
  expiresAt: string;
  redeemed: boolean;
}

export interface RewardStats {
  pointsEarned: number;
  pointsSpent: number;
  offersUsed: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  club: string;
  memberSince: string;
}

interface WalletContextType {
  isAuthenticated: boolean;
  authenticatedUser: CurrentUser | null;
  isLoading: boolean;
  isRestoringSession: boolean;
  authError: string | null;
  isOnboarded: boolean;
  followedClubIds: string[];
  user: User | null;
  balance: number;
  totalSpend: number;
  rewloPoints: number;
  rewardStats: RewardStats;
  transactions: Transaction[];
  cards: VirtualCard[];
  offers: Offer[];
  selectedClubId: string;
  setSelectedClub: (id: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (request: RegisterRequest, primaryClubId: string, clubIds: string[]) => Promise<boolean>;
  restoreSession: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  getCurrentUser: () => Promise<CurrentUser | null>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  completeOnboarding: (email: string, primaryClubId: string, clubIds: string[]) => Promise<void>;
  completeAuthenticatedRegistration: (currentUser: CurrentUser, primaryClubId: string, clubIds: string[]) => Promise<void>;
  sendMoney: (amount: number, recipient: string) => void;
  redeemOffer: (offerId: string) => Promise<void>;
  refreshWallet: () => Promise<void>;
  spendPoints: (points: number) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "date">) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

type LedgerItem = {
  id: string;
  type: string;
  status: Transaction["status"];
  amountCents: number;
  description: string;
  merchant: string | null;
  createdAt: string;
};

function transactionFromLedger(item: LedgerItem): Transaction {
  const type: Transaction["type"] =
    item.type === "send" ? "send"
      : item.type === "receive" ? "receive"
        : item.type === "merchant_payment" ? "payment"
          : item.type === "top_up" || item.type === "mint" ? "topup"
            : item.type.startsWith("reward_") || item.type === "burn" ? "reward"
              : "payment";
  return {
    id: item.id,
    type,
    amount: item.amountCents / 100,
    description: item.description,
    merchant: item.merchant ?? undefined,
    date: item.createdAt,
    status: item.status,
  };
}

function toWalletUser(currentUser: CurrentUser, clubId?: string): User {
  return {
    id: String(currentUser.id),
    name: currentUser.fullName,
    email: currentUser.email,
    phone: "",
    club: clubId ? getClubById(clubId).name : "",
    memberSince: new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
  };
}

const MOCK_USER: User = {
  id: "usr_001",
  name: "Alex Johnson",
  email: "alex@rewlo.io",
  phone: "+1 (555) 0134",
  club: "Manchester City",
  memberSince: "Jan 2024",
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx_001",
    type: "receive",
    amount: 250.0,
    description: "Match Day Bonus",
    merchant: "Manchester City FC",
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    clubTag: "MCFC",
  },
  {
    id: "tx_002",
    type: "payment",
    amount: -45.5,
    description: "Stadium Catering",
    merchant: "Etihad Stadium",
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    clubTag: "MCFC",
  },
  {
    id: "tx_003",
    type: "reward",
    amount: 0,
    description: "500 Rewlo Points Earned",
    merchant: "Nike Store",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "tx_004",
    type: "send",
    amount: -120.0,
    description: "Match Ticket",
    merchant: "Ticketmaster",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "tx_005",
    type: "topup",
    amount: 500.0,
    description: "Wallet Top Up",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "tx_006",
    type: "payment",
    amount: -28.99,
    description: "Club Shop Purchase",
    merchant: "MCFC Official Store",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
    clubTag: "MCFC",
  },
  {
    id: "tx_007",
    type: "receive",
    amount: 75.0,
    description: "Referral Reward",
    merchant: "Rewlo",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
];

const MOCK_CARDS: VirtualCard[] = [
  {
    id: "card_001",
    last4: "XXXX",
    brand: "visa",
    expiryMonth: 3,
    expiryYear: 28,
    gradientStart: "#1C2C5B",
    gradientEnd: "#6CADDF",
    clubName: "Manchester City",
    isDefault: true,
    cardholderName: "ALEX JOHNSON",
  },
  {
    id: "card_002",
    last4: "XXXX",
    brand: "mastercard",
    expiryMonth: 11,
    expiryYear: 27,
    gradientStart: "#0D1B2A",
    gradientEnd: "#1C3A5C",
    clubName: "Rewlo Premium",
    isDefault: false,
    cardholderName: "ALEX JOHNSON",
  },
];

const MOCK_OFFERS: Offer[] = [
  {
    id: "off_001",
    merchant: "Nike",
    category: "Sports",
    description: "20% off on all football boots",
    discount: "20% OFF",
    pointsCost: 500,
    expiresAt: "2025-07-31",
    redeemed: false,
  },
  {
    id: "off_002",
    merchant: "Adidas",
    category: "Sports",
    description: "Free jersey personalisation",
    discount: "FREE",
    pointsCost: 800,
    expiresAt: "2025-07-15",
    redeemed: false,
  },
  {
    id: "off_003",
    merchant: "Etihad Stadium",
    category: "Stadium",
    description: "Buy 2 get 1 free on food & drinks",
    discount: "B2G1",
    pointsCost: 300,
    expiresAt: "2025-08-01",
    redeemed: false,
  },
  {
    id: "off_004",
    merchant: "Sky Sports",
    category: "Media",
    description: "1 month free premium subscription",
    discount: "1 MONTH FREE",
    pointsCost: 1200,
    expiresAt: "2025-06-30",
    redeemed: false,
  },
  {
    id: "off_005",
    merchant: "Puma",
    category: "Sports",
    description: "15% off training gear",
    discount: "15% OFF",
    pointsCost: 400,
    expiresAt: "2025-08-15",
    redeemed: false,
  },
  {
    id: "off_006",
    merchant: "EA Sports FC",
    category: "Gaming",
    description: "5000 FIFA Points bonus",
    discount: "5K POINTS",
    pointsCost: 600,
    expiresAt: "2025-07-20",
    redeemed: false,
  },
];

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [followedClubIds, setFollowedClubIds] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [rewloPoints, setRewloPoints] = useState(2350);
  const [rewardStats, setRewardStats] = useState<RewardStats>({ pointsEarned: 0, pointsSpent: 0, offersUsed: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<VirtualCard[]>(MOCK_CARDS);
  // Offers are provider-backed database records. Do not expose preview IDs
  // such as `off_001`, which cannot be redeemed by the API.
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedClubId, setSelectedClubId] = useState(DEFAULT_CLUB_ID);

  const refreshWallet = useCallback(async () => {
    const [summary, rewards, ledger] = await Promise.all([
      walletRequest<{ balanceCents: number; rewardPoints: number; totalSpendCents: number }>("/api/wallet/summary"),
      walletRequest<{ points: number; stats: RewardStats; offers: Array<{ id:number; merchant:string; category:string; description:string; discount:string; pointsCost:number; expiresAt:string; redeemed:boolean }> }>("/api/rewards"),
      walletRequest<{ items: LedgerItem[] }>("/api/wallet/transactions?page=1&pageSize=4"),
    ]);
    setBalance(summary.balanceCents / 100);
    setTotalSpend(summary.totalSpendCents / 100);
    setRewloPoints(rewards.points);
    setRewardStats(rewards.stats);
    setOffers(rewards.offers.map(o => ({ ...o, id: String(o.id) })));
    setTransactions(ledger.items.map(transactionFromLedger));
  }, []);

  useEffect(() => {
    configureAuthClient();
    setSessionExpiredHandler(() => {
      setAuthenticatedUser(null);
      setIsAuthenticated(false);
      setIsOnboarded(false);
      setUser(null);
      setAuthError("Your session has ended. Please sign in again.");
    });
    Promise.all([
      AsyncStorage.getItem("rewlo_onboarded"),
      AsyncStorage.getItem("rewlo_auth"),
      AsyncStorage.getItem("rewlo_club"),
      AsyncStorage.getItem("rewlo_followed_clubs"),
      AsyncStorage.getItem("rewlo_email"),
    ]).then(async ([onboarded, auth, club, followed, email]) => {
      const loggedIn = onboarded === "true" || auth === "true";
      if (loggedIn) {
        setIsOnboarded(true);
        setIsAuthenticated(true);
        setUser({ ...MOCK_USER, ...(email ? { email } : {}) });
      }
      if (club) setSelectedClubId(club);
      if (followed) {
        try { setFollowedClubIds(JSON.parse(followed)); } catch {}
      }

      // A valid secure token is the source of truth when this device has used
      // the API authentication flow. Legacy preview state remains supported.
      try {
        const currentUser = await restoreAuthSession();
        if (!currentUser) return;
        setIsOnboarded(true);
        setIsAuthenticated(true);
        setAuthenticatedUser(currentUser);
        setUser(toWalletUser(currentUser, club ?? undefined));
      } catch {
        // No token, an expired token, or an offline API must not prevent the
        // existing onboarding preview state from loading.
      } finally { setIsRestoringSession(false); }
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const currentUser = await loginWithPassword(email, password);
      if (currentUser.walletProvisioningStatus !== "completed" && currentUser.walletProvisioningStatus !== "provisioned") {
        await logoutSession();
        setAuthError("Your wallet is still being set up. Please try again shortly.");
        return false;
      }
      await AsyncStorage.multiSet([["rewlo_auth", "true"], ["rewlo_onboarded", "true"], ["rewlo_email", currentUser.email], ["rewlo_user_id", String(currentUser.id)]]);
      setIsAuthenticated(true);
      setIsOnboarded(true);
      setAuthenticatedUser(currentUser);
      setUser(toWalletUser(currentUser, selectedClubId));
      return true;
    } catch (error) {
      const status = typeof error === "object" && error !== null && "status" in error ? (error as { status?: unknown }).status : null;
      setAuthError(status === 401 ? "Invalid email or password." : "Unable to sign in. Please check your connection and try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedClubId]);

  const setSelectedClub = useCallback(async (id: string) => {
    setSelectedClubId(id);
      await AsyncStorage.setItem("rewlo_club", id);
    const club = getClubById(id);
    setCards((prev) =>
      prev.map((c) =>
        c.isDefault
          ? { ...c, gradientStart: club.gradientStart, gradientEnd: club.gradientEnd, clubName: club.name }
          : c
      )
    );
  }, []);

  const completeOnboarding = useCallback(
    async (email: string, primaryClubId: string, clubIds: string[]) => {
      await AsyncStorage.multiSet([
        ["rewlo_onboarded", "true"],
        ["rewlo_auth", "true"],
        ["rewlo_email", email],
        ["rewlo_club", primaryClubId],
        ["rewlo_followed_clubs", JSON.stringify(clubIds)],
      ]);
      setIsOnboarded(true);
      setIsAuthenticated(true);
      setFollowedClubIds(clubIds);
      setSelectedClubId(primaryClubId);
      setUser({ ...MOCK_USER, email });
      const club = getClubById(primaryClubId);
      setCards((prev) =>
        prev.map((c) =>
          c.isDefault
            ? { ...c, gradientStart: club.gradientStart, gradientEnd: club.gradientEnd, clubName: club.name }
            : c
        )
      );
    },
    []
  );

  const completeAuthenticatedRegistration = useCallback(
    async (currentUser: CurrentUser, primaryClubId: string, clubIds: string[]) => {
      await AsyncStorage.multiSet([
        ["rewlo_onboarded", "true"],
        ["rewlo_auth", "true"],
        ["rewlo_email", currentUser.email],
        ["rewlo_user_id", String(currentUser.id)],
        ["rewlo_club", primaryClubId],
        ["rewlo_followed_clubs", JSON.stringify(clubIds)],
      ]);
      setIsOnboarded(true);
      setIsAuthenticated(true);
      setAuthenticatedUser(currentUser);
      setFollowedClubIds(clubIds);
      setSelectedClubId(primaryClubId);
      setUser(toWalletUser(currentUser, primaryClubId));
    },
    [],
  );

  const register = useCallback(async (request: RegisterRequest, primaryClubId: string, clubIds: string[]) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const currentUser = await registerAccount(request);
      await completeAuthenticatedRegistration(currentUser, primaryClubId, clubIds);
      return true;
    } catch {
      setAuthError("We could not create your account. Please try again.");
      return false;
    } finally { setIsLoading(false); }
  }, [completeAuthenticatedRegistration]);

  const getCurrentUser = useCallback(async () => {
    const currentUser = await restoreAuthSession();
    if (currentUser) {
      setAuthenticatedUser(currentUser);
      setUser(toWalletUser(currentUser, selectedClubId));
    }
    return currentUser;
  }, [selectedClubId]);

  const restoreSession = useCallback(async () => {
    setIsRestoringSession(true);
    setAuthError(null);
    try {
      const currentUser = await restoreAuthSession();
      if (currentUser) {
        setAuthenticatedUser(currentUser);
        setIsAuthenticated(true);
        setIsOnboarded(true);
        setUser(toWalletUser(currentUser, selectedClubId));
      }
    } finally { setIsRestoringSession(false); }
  }, [selectedClubId]);

  const refreshSession = useCallback(async () => {
    const refreshed = await refreshAuthSession();
    if (!refreshed) {
      setAuthenticatedUser(null);
      setIsAuthenticated(false);
      setAuthError("Your session has ended. Please sign in again.");
    }
    return refreshed;
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setAuthError(null);
    try { await requestPasswordReset(email); return true; }
    catch { setAuthError("Unable to request a password reset. Please try again."); return false; }
    finally { setIsLoading(false); }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    setIsLoading(true);
    setAuthError(null);
    try { await submitPasswordReset(token, newPassword); return true; }
    catch { setAuthError("Unable to reset your password. Please request a new link."); return false; }
    finally { setIsLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("rewlo_auth");
    await AsyncStorage.removeItem("rewlo_onboarded");
    setIsAuthenticated(false);
    setIsOnboarded(false);
    setUser(null);
    setAuthenticatedUser(null);
    setAuthError(null);
    // Token revocation is best effort and must not delay local logout.
    void logoutSession();
  }, []);

  const deleteAccount = useCallback(async () => {
    await logoutSession();
    await AsyncStorage.multiRemove([
      "rewlo_auth",
      "rewlo_onboarded",
      "rewlo_email",
      "rewlo_club",
      "rewlo_followed_clubs",
      "rewlo_user_id",
    ]);
    setIsAuthenticated(false);
    setIsOnboarded(false);
    setUser(null);
    setAuthenticatedUser(null);
    setFollowedClubIds([]);
    setBalance(0);
    setTotalSpend(0);
    setRewloPoints(2350);
    setRewardStats({ pointsEarned: 0, pointsSpent: 0, offersUsed: 0 });
    setTransactions([]);
    setCards(MOCK_CARDS);
    setOffers([]);
    setSelectedClubId(DEFAULT_CLUB_ID);
  }, []);

  const addTransaction = useCallback((tx: Omit<Transaction, "id" | "date">) => {
    const newTx: Transaction = {
      ...tx,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    if (tx.amount > 0) {
      setBalance((prev) => prev + tx.amount);
    } else {
      setBalance((prev) => prev + tx.amount);
    }
  }, []);

  const sendMoney = useCallback(
    (amount: number, recipient: string) => {
      addTransaction({
        type: "send",
        amount: -amount,
        description: `Sent to ${recipient}`,
        status: "completed",
      });
    },
    [addTransaction]
  );

  const redeemOffer = useCallback(
    async (offerId: string) => {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer || offer.redeemed || rewloPoints < offer.pointsCost) return;
      await walletRequest(`/api/rewards/${offerId}/redeem`, { method: "POST" });
      await refreshWallet();
    },
    [offers, rewloPoints, refreshWallet]
  );

  const spendPoints = useCallback((points: number) => {
    if (points <= 0) return;
    setRewloPoints((prev) => Math.max(0, prev - points));
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isAuthenticated,
        authenticatedUser,
        isLoading,
        isRestoringSession,
        authError,
        isOnboarded,
        followedClubIds,
        user,
        balance,
        totalSpend,
        rewloPoints,
        rewardStats,
        transactions,
        cards,
        offers,
        selectedClubId,
        setSelectedClub,
        login,
        register,
        restoreSession,
        refreshSession,
        getCurrentUser,
        forgotPassword,
        resetPassword,
        logout,
        deleteAccount,
        completeOnboarding,
        completeAuthenticatedRegistration,
        sendMoney,
        redeemOffer,
        refreshWallet,
        spendPoints,
        addTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
