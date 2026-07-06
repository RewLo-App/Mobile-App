import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { DEFAULT_CLUB_ID, getClubById } from "@/constants/clubs";

export interface Transaction {
  id: string;
  type: "send" | "receive" | "payment" | "reward" | "topup";
  amount: number;
  description: string;
  merchant?: string;
  date: string;
  status: "completed" | "pending";
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
  isOnboarded: boolean;
  followedClubIds: string[];
  user: User | null;
  balance: number;
  rewloPoints: number;
  transactions: Transaction[];
  cards: VirtualCard[];
  offers: Offer[];
  selectedClubId: string;
  setSelectedClub: (id: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: (email: string, primaryClubId: string, clubIds: string[]) => Promise<void>;
  sendMoney: (amount: number, recipient: string) => void;
  redeemOffer: (offerId: string) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "date">) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

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
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [followedClubIds, setFollowedClubIds] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState(0);
  const [rewloPoints, setRewloPoints] = useState(2350);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [cards, setCards] = useState<VirtualCard[]>(MOCK_CARDS);
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [selectedClubId, setSelectedClubId] = useState(DEFAULT_CLUB_ID);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("rewlo_onboarded"),
      AsyncStorage.getItem("rewlo_auth"),
      AsyncStorage.getItem("rewlo_club"),
      AsyncStorage.getItem("rewlo_followed_clubs"),
      AsyncStorage.getItem("rewlo_email"),
    ]).then(([onboarded, auth, club, followed, email]) => {
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
    });
  }, []);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    if (email.length > 0) {
      await AsyncStorage.setItem("rewlo_auth", "true");
      setIsAuthenticated(true);
      setUser(MOCK_USER);
      return true;
    }
    return false;
  }, []);

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

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("rewlo_auth");
    await AsyncStorage.removeItem("rewlo_onboarded");
    setIsAuthenticated(false);
    setIsOnboarded(false);
    setUser(null);
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
    (offerId: string) => {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer || offer.redeemed || rewloPoints < offer.pointsCost) return;
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, redeemed: true } : o)));
      setRewloPoints((prev) => prev - offer.pointsCost);
      addTransaction({
        type: "reward",
        amount: 0,
        description: `Redeemed: ${offer.description}`,
        merchant: offer.merchant,
        status: "completed",
      });
    },
    [offers, rewloPoints, addTransaction]
  );

  return (
    <WalletContext.Provider
      value={{
        isAuthenticated,
        isOnboarded,
        followedClubIds,
        user,
        balance,
        rewloPoints,
        transactions,
        cards,
        offers,
        selectedClubId,
        setSelectedClub,
        login,
        logout,
        completeOnboarding,
        sendMoney,
        redeemOffer,
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
