--
-- PostgreSQL database dump
--

\restrict gUVr2akF3WThUY04kKjqg528o5WC9Efsoknz2VOvsOsCTN39LQ1a3Em3ZFxMINc

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_related_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_merchant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_roles_id_fk;
ALTER TABLE IF EXISTS ONLY public.user_cards DROP CONSTRAINT IF EXISTS user_cards_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reward_transactions DROP CONSTRAINT IF EXISTS reward_transactions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_replaced_by_token_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.offers DROP CONSTRAINT IF EXISTS offers_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.offer_redemptions DROP CONSTRAINT IF EXISTS offer_redemptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.offer_redemptions DROP CONSTRAINT IF EXISTS offer_redemptions_offer_id_fkey;
DROP INDEX IF EXISTS public.wallet_transactions_user_created_at_idx;
DROP INDEX IF EXISTS public.wallet_transactions_related_user_idx;
DROP INDEX IF EXISTS public.wallet_transactions_merchant_created_at_idx;
DROP INDEX IF EXISTS public.users_wallet_provisioning_status_idx;
DROP INDEX IF EXISTS public.users_wallet_provisioning_key_unique;
DROP INDEX IF EXISTS public.users_role_id_idx;
DROP INDEX IF EXISTS public.users_normalized_email_unique;
DROP INDEX IF EXISTS public.users_blockchain_network_idx;
DROP INDEX IF EXISTS public.user_cards_one_default_per_user;
DROP INDEX IF EXISTS public.reward_transactions_user_created_idx;
DROP INDEX IF EXISTS public.revoked_access_tokens_token_id_unique;
DROP INDEX IF EXISTS public.revoked_access_tokens_expires_at_idx;
DROP INDEX IF EXISTS public.refresh_tokens_user_expires_at_idx;
DROP INDEX IF EXISTS public.refresh_tokens_token_hash_unique;
DROP INDEX IF EXISTS public.refresh_tokens_family_created_at_idx;
DROP INDEX IF EXISTS public.password_reset_tokens_user_expires_at_idx;
DROP INDEX IF EXISTS public.password_reset_tokens_token_hash_unique;
DROP INDEX IF EXISTS public.password_reset_requests_email_created_at_idx;
DROP INDEX IF EXISTS public.offer_redemptions_user_offer_unique;
DROP INDEX IF EXISTS public.merchants_wallet_provisioning_status_idx;
DROP INDEX IF EXISTS public.merchants_wallet_provisioning_key_unique;
DROP INDEX IF EXISTS public.merchants_brale_address_id_unique;
DROP INDEX IF EXISTS public.merchants_blockchain_network_idx;
ALTER TABLE IF EXISTS ONLY public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_reference_key;
ALTER TABLE IF EXISTS ONLY public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.user_cards DROP CONSTRAINT IF EXISTS user_cards_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE IF EXISTS ONLY public.reward_transactions DROP CONSTRAINT IF EXISTS reward_transactions_reference_key;
ALTER TABLE IF EXISTS ONLY public.reward_transactions DROP CONSTRAINT IF EXISTS reward_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.revoked_access_tokens DROP CONSTRAINT IF EXISTS revoked_access_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_tokens DROP CONSTRAINT IF EXISTS password_reset_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_requests DROP CONSTRAINT IF EXISTS password_reset_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.offers DROP CONSTRAINT IF EXISTS offers_pkey;
ALTER TABLE IF EXISTS ONLY public.offer_redemptions DROP CONSTRAINT IF EXISTS offer_redemptions_reference_key;
ALTER TABLE IF EXISTS ONLY public.offer_redemptions DROP CONSTRAINT IF EXISTS offer_redemptions_pkey;
ALTER TABLE IF EXISTS ONLY public.offer_categories DROP CONSTRAINT IF EXISTS offer_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.offer_categories DROP CONSTRAINT IF EXISTS offer_categories_name_key;
ALTER TABLE IF EXISTS ONLY public.merchants DROP CONSTRAINT IF EXISTS merchants_pkey;
ALTER TABLE IF EXISTS ONLY public.merchants DROP CONSTRAINT IF EXISTS merchants_merchant_code_key;
ALTER TABLE IF EXISTS ONLY public.merchants DROP CONSTRAINT IF EXISTS merchants_email_key;
ALTER TABLE IF EXISTS ONLY public.app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS public.wallet_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_cards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reward_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.revoked_access_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.offers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.offer_redemptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.offer_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.merchants ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.wallet_transactions_id_seq;
DROP TABLE IF EXISTS public.wallet_transactions;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_cards_id_seq;
DROP TABLE IF EXISTS public.user_cards;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP SEQUENCE IF EXISTS public.reward_transactions_id_seq;
DROP TABLE IF EXISTS public.reward_transactions;
DROP SEQUENCE IF EXISTS public.revoked_access_tokens_id_seq;
DROP TABLE IF EXISTS public.revoked_access_tokens;
DROP SEQUENCE IF EXISTS public.refresh_tokens_id_seq;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP SEQUENCE IF EXISTS public.password_reset_tokens_id_seq;
DROP TABLE IF EXISTS public.password_reset_tokens;
DROP SEQUENCE IF EXISTS public.password_reset_requests_id_seq;
DROP TABLE IF EXISTS public.password_reset_requests;
DROP SEQUENCE IF EXISTS public.offers_id_seq;
DROP TABLE IF EXISTS public.offers;
DROP SEQUENCE IF EXISTS public.offer_redemptions_id_seq;
DROP TABLE IF EXISTS public.offer_redemptions;
DROP SEQUENCE IF EXISTS public.offer_categories_id_seq;
DROP TABLE IF EXISTS public.offer_categories;
DROP SEQUENCE IF EXISTS public.merchants_id_seq;
DROP TABLE IF EXISTS public.merchants;
DROP TABLE IF EXISTS public.app_settings;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP TYPE IF EXISTS public.wallet_transaction_type;
DROP TYPE IF EXISTS public.wallet_transaction_status;
DROP TYPE IF EXISTS public.wallet_provisioning_status;
DROP TYPE IF EXISTS public.user_status;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'suspended'
);


--
-- Name: wallet_provisioning_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_provisioning_status AS ENUM (
    'not_requested',
    'pending',
    'provisioned',
    'failed',
    'completed'
);


--
-- Name: wallet_transaction_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'reversed'
);


--
-- Name: wallet_transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.wallet_transaction_type AS ENUM (
    'top_up',
    'send',
    'receive',
    'reward',
    'redeem',
    'merchant_payment',
    'mint',
    'burn',
    'transfer',
    'balance_check',
    'status_check'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: merchants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchants (
    id integer NOT NULL,
    merchant_code text NOT NULL,
    merchant_name text NOT NULL,
    email text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    brale_address_id text,
    rewlo_cash_balance integer DEFAULT 0 NOT NULL,
    brale_account_id text,
    brale_wallet_id text,
    blockchain_address text,
    blockchain_network text,
    wallet_provisioning_status public.wallet_provisioning_status DEFAULT 'not_requested'::public.wallet_provisioning_status NOT NULL,
    wallet_provisioning_error text,
    wallet_provisioning_key text,
    wallet_provisioned_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: merchants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.merchants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: merchants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.merchants_id_seq OWNED BY public.merchants.id;


--
-- Name: offer_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_categories (
    id integer NOT NULL,
    name text NOT NULL,
    icon text NOT NULL
);


--
-- Name: offer_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offer_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offer_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offer_categories_id_seq OWNED BY public.offer_categories.id;


--
-- Name: offer_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offer_redemptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    offer_id integer NOT NULL,
    points_spent integer NOT NULL,
    reference text NOT NULL,
    brale_transaction_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: offer_redemptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offer_redemptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offer_redemptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offer_redemptions_id_seq OWNED BY public.offer_redemptions.id;


--
-- Name: offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offers (
    id integer NOT NULL,
    category_id integer NOT NULL,
    merchant text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    discount_label text NOT NULL,
    points_required integer NOT NULL,
    redemption_value_cents integer DEFAULT 100 NOT NULL,
    available boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.offers_id_seq OWNED BY public.offers.id;


--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_requests (
    id integer NOT NULL,
    normalized_email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_requests_id_seq OWNED BY public.password_reset_requests.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash text NOT NULL,
    token_family text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    replaced_by_token_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: revoked_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revoked_access_tokens (
    id integer NOT NULL,
    token_id text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: revoked_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.revoked_access_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: revoked_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.revoked_access_tokens_id_seq OWNED BY public.revoked_access_tokens.id;


--
-- Name: reward_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    points_delta integer NOT NULL,
    reason text NOT NULL,
    reference text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reward_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reward_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reward_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reward_transactions_id_seq OWNED BY public.reward_transactions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: user_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_cards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    card_holder text NOT NULL,
    last4_digits text NOT NULL,
    expiry text NOT NULL,
    card_type text NOT NULL,
    provider text NOT NULL,
    is_default boolean DEFAULT false NOT NULL
);


--
-- Name: user_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_cards_id_seq OWNED BY public.user_cards.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    primary_club_id text,
    followed_club_ids text DEFAULT '[]'::text NOT NULL,
    zip_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_number text,
    role_id integer NOT NULL,
    rewlo_cash_balance integer DEFAULT 0 NOT NULL,
    rewlo_points integer DEFAULT 2350 CONSTRAINT users_rewlo_reward_points_not_null NOT NULL,
    brale_address_id text,
    normalized_email text NOT NULL,
    password_hash text NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    brale_account_id text,
    blockchain_address text,
    blockchain_network text,
    wallet_provisioning_status public.wallet_provisioning_status DEFAULT 'not_requested'::public.wallet_provisioning_status NOT NULL,
    wallet_provisioning_error text,
    wallet_provisioned_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    brale_wallet_id text,
    wallet_provisioning_key text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallet_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    related_user_id integer,
    merchant_id integer,
    type public.wallet_transaction_type NOT NULL,
    status public.wallet_transaction_status DEFAULT 'pending'::public.wallet_transaction_status NOT NULL,
    amount_cents integer DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    reward_points_delta integer DEFAULT 0 NOT NULL,
    reference text NOT NULL,
    external_transaction_id text,
    blockchain_hash text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.wallet_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.wallet_transactions_id_seq OWNED BY public.wallet_transactions.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: merchants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants ALTER COLUMN id SET DEFAULT nextval('public.merchants_id_seq'::regclass);


--
-- Name: offer_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_categories ALTER COLUMN id SET DEFAULT nextval('public.offer_categories_id_seq'::regclass);


--
-- Name: offer_redemptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_redemptions ALTER COLUMN id SET DEFAULT nextval('public.offer_redemptions_id_seq'::regclass);


--
-- Name: offers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers ALTER COLUMN id SET DEFAULT nextval('public.offers_id_seq'::regclass);


--
-- Name: password_reset_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests ALTER COLUMN id SET DEFAULT nextval('public.password_reset_requests_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: revoked_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revoked_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.revoked_access_tokens_id_seq'::regclass);


--
-- Name: reward_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_transactions ALTER COLUMN id SET DEFAULT nextval('public.reward_transactions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: user_cards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cards ALTER COLUMN id SET DEFAULT nextval('public.user_cards_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wallet_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions ALTER COLUMN id SET DEFAULT nextval('public.wallet_transactions_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	50646bbc7aa5b4f6913842be9742eaf4faf0e87bd8ae477276a407ec860c8c7e	1784754822011
2	2a8d90745478d053f26844fbeb0667801fc83da1223ad306fda33180efe3d2d8	1784754822012
3	7e67eac3a044d748dfc8b15f549e3785844c95f32fc8c248ed00247251ba294c	1784754822013
4	a78b6bd036e023aba0aff3b2891e1715945f76bf46e32ef20f4915f6cfcb680e	1784754822014
5	341bf516c9d2eed231def84c65069a0a3dc92e27d71411c23834b4618abc53c2	1784754822015
6	76e562bfb625f225bb97f1411417f6288f842c6a6dd1aa6d00146ebe41f041c4	1784754822016
7	b0ab06cc4647d47a26f79cb1ee062a8e503633696aaddee9a8ae28310120477c	1784754822017
8	d30fae804424b09fba0921a97586bfd944c658d2b3c572002b14aeb28edab535	1784754822018
9	1d4f8e4ef70681dd4f0a5653f2b9e23f82e8e359d714fbcf61b9ccfaa968737b	1784754822019
10	37b37095beaf4e8622f34fc90df717aeb054eecf3ea627194366f412fcc88610	1784754822020
11	1d56d27bff6988922644e6fff494c64c86c8595a8b8e230e75e769e37bd21ecd	1784754822021
\.


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (key, value) FROM stdin;
welcome_points	2350
\.


--
-- Data for Name: merchants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.merchants (id, merchant_code, merchant_name, email, description, created_at, brale_address_id, rewlo_cash_balance, brale_account_id, brale_wallet_id, blockchain_address, blockchain_network, wallet_provisioning_status, wallet_provisioning_error, wallet_provisioning_key, wallet_provisioned_at, updated_at) FROM stdin;
1	MANC001	Manchester City Official Store	store@manc001.demo.rewlo.io	Official match-day merchandise and supporter gear.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
2	ARS001	Arsenal Fan Shop	store@ars001.demo.rewlo.io	Licensed Arsenal apparel and match-day essentials.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
3	CHE001	Chelsea Stadium Catering	ops@che001.demo.rewlo.io	Food, drinks, and hospitality at Stamford Bridge.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
5	LAL001	Lakers Team Store	store@lal001.demo.rewlo.io	Los Angeles Lakers merchandise and tickets.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
6	NYK001	Knicks Garden Market	ops@nyk001.demo.rewlo.io	Madison Square Garden concessions and fan items.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
7	DAL001	Dallas Matchday Market	ops@dal001.demo.rewlo.io	Cowboys match-day retail and concessions.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
8	MIA001	Miami Fan Zone	store@mia001.demo.rewlo.io	Dolphins fan merchandise and experiences.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
9	SEA001	Seattle Supporters Shop	store@sea001.demo.rewlo.io	Seahawks supporter gear and stadium offers.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
10	BOS001	Boston Championship Store	store@bos001.demo.rewlo.io	Celtics and Red Sox licensed products.	2026-07-23 02:56:18.476578+05:30	\N	0	\N	\N	\N	\N	not_requested	\N	\N	\N	2026-07-24 02:25:24.011536+05:30
4	LIV001	Liverpool FC Retail	store@liv001.demo.rewlo.io	Official Liverpool FC retail partner.	2026-07-23 02:56:18.476578+05:30	3G94MsNyJdHnLQat7KCXT7WlO04	400	3G94MJwthANtdLBvLNDmEhh2DmQ	3G94MsNyJdHnLQat7KCXT7WlO04	0x751E01f416A4AD3157580EA0ee3F65941FBa75B1	base_sepolia	completed	\N	cac7c73b-22f1-46cf-94c9-81eccef76a53	2026-07-24 00:03:39.505+05:30	2026-07-24 03:26:14.057+05:30
\.


--
-- Data for Name: offer_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offer_categories (id, name, icon) FROM stdin;
1	Sports	pricetag-outline
2	Stadium	pricetag-outline
3	Merchandise	pricetag-outline
4	Tickets	pricetag-outline
5	Media	pricetag-outline
6	Gaming	pricetag-outline
7	Food	pricetag-outline
8	Experiences	pricetag-outline
\.


--
-- Data for Name: offer_redemptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offer_redemptions (id, user_id, offer_id, points_spent, reference, brale_transaction_id, created_at) FROM stdin;
1	3	16	500	REDEEM-3-16	3Guzz0hingiBQfuI7yGT9StF1VL	2026-07-24 01:25:00.377494+05:30
2	4	16	500	REDEEM-4-16	3Gv8vxUGJtcEltI81yGtaaVdJrH	2026-07-24 02:38:36.481442+05:30
3	4	10	750	REDEEM-4-10	3Gv8x12lBIkpESDAOUgDfpbKKJs	2026-07-24 02:38:44.587847+05:30
4	5	16	500	REDEEM-5-16	3GvCUxv9lOiaZuIWYV883xnxq5n	2026-07-24 03:07:54.853304+05:30
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.offers (id, category_id, merchant, title, description, discount_label, points_required, redemption_value_cents, available, expires_at, created_at) FROM stdin;
1	1	Nike	20% off football boots	20% off football boots	20% OFF	500	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
2	1	Adidas	Free jersey personalisation	Free jersey personalisation	FREE	800	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
3	2	Etihad Stadium	Matchday meal bundle	Matchday meal bundle	$10 OFF	650	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
4	1	Puma	15% off training gear	15% off training gear	15% OFF	400	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
5	3	Fanatics	$20 off licensed merchandise	$20 off licensed merchandise	$20 OFF	900	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
6	2	Wembley Stadium	Stadium tour discount	Stadium tour discount	2 FOR 1	1200	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
7	4	Ticketmaster	No service fee on match tickets	No service fee on match tickets	NO FEE	1000	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
8	5	Sky Sports	One month sports pass	One month sports pass	1 MONTH	1400	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
9	6	EA Sports FC	Bonus FC points	Bonus FC points	5K POINTS	600	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
10	1	Under Armour	25% off fan apparel	25% off fan apparel	25% OFF	750	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
11	2	Old Trafford	Free matchday programme	Free matchday programme	FREE	350	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
12	2	Anfield	Museum entry discount	Museum entry discount	30% OFF	550	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
13	3	New Era	Club cap discount	Club cap discount	20% OFF	450	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
14	7	Levy Restaurants	Free stadium drink	Free stadium drink	FREE	300	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
15	4	SeatGeek	$15 ticket credit	$15 ticket credit	$15 OFF	850	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
16	1	New Balance	Running gear discount	Running gear discount	15% OFF	500	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
17	5	ESPN+	One month subscription	One month subscription	1 MONTH	1300	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
18	6	PlayStation	Sports game credit	Sports game credit	$10 CREDIT	700	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
19	8	Manchester City	Training ground tour	Training ground tour	VIP TOUR	2500	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
20	8	Arsenal FC	Signed shirt prize draw	Signed shirt prize draw	ENTRY	200	100	t	2028-01-01 05:29:59+05:30	2026-07-23 04:35:08.717881+05:30
\.


--
-- Data for Name: password_reset_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_requests (id, normalized_email, created_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token_hash, token_family, expires_at, revoked_at, replaced_by_token_id, created_at) FROM stdin;
2	1	4310c3142dab41bb39b430b3496802752582bc3b228d448e1682be924864a60e	a3141897-00df-49fa-a5f9-4a2611c083aa	2026-08-22 23:35:37.396+05:30	\N	\N	2026-07-23 23:35:37.39489+05:30
1	1	8202c0714104e0daf9bcf0a8be5dadf5b57533305a101d3b31c81c1eb2d76677	a3141897-00df-49fa-a5f9-4a2611c083aa	2026-08-22 22:49:36.569+05:30	2026-07-23 23:35:37.398+05:30	2	2026-07-23 22:49:36.570425+05:30
3	2	fc22cf41a2f3f03795cb127cd0e8f2a8f4f15ac643f3618bc4d6098d9fe2b05a	21c8de28-4710-4c90-b245-5de0f630cfb3	2026-08-22 23:49:03.023+05:30	\N	\N	2026-07-23 23:49:03.023911+05:30
5	3	51fefe107c86b6e85aa5741c20328b2d9ee99c90acc0a0abc73ed229aa9ebc34	c998edbf-6115-45f2-9131-849fcd33c20d	2026-08-23 00:12:51.617+05:30	2026-07-24 00:30:41.534+05:30	6	2026-07-24 00:12:51.618308+05:30
6	3	2aa30239265c7750d68e01d8d3e274c5a3ecce35d75276a65cd4698b2962228d	c998edbf-6115-45f2-9131-849fcd33c20d	2026-08-23 00:30:41.533+05:30	2026-07-24 00:46:31.138+05:30	7	2026-07-24 00:30:41.533453+05:30
7	3	6715979e060cc4051c904d8ca62323f19eeea337560e2761f209d9e14206f1b1	c998edbf-6115-45f2-9131-849fcd33c20d	2026-08-23 00:46:31.136+05:30	2026-07-24 01:04:09.301+05:30	8	2026-07-24 00:46:31.135866+05:30
9	3	af66cf7c6646d5b5fa92af5890799b642415610f6b8bdbf08cb7ea0c93bd70ba	c998edbf-6115-45f2-9131-849fcd33c20d	2026-08-23 01:23:39.958+05:30	\N	\N	2026-07-24 01:23:39.956999+05:30
8	3	6425af4236232d3a9e5233f199cb1ec81db20777b847262cb4ab9bf57ff1ffcb	c998edbf-6115-45f2-9131-849fcd33c20d	2026-08-23 01:04:09.3+05:30	2026-07-24 01:23:39.961+05:30	9	2026-07-24 01:04:09.300031+05:30
10	3	55b682fd1020474db58eb44c6288abdbbd03240b8c5385510d208b321f377839	5f1bb709-142d-4e7d-99e2-b19fc512e018	2026-08-23 01:37:06.42+05:30	\N	\N	2026-07-24 01:37:06.421847+05:30
11	3	bfd8f15077d0673147726ed636d05ac6857286fc1ca2f8517454f3e8f12cf4d8	cb9800c3-5ad8-4527-b956-884a135ddaf2	2026-08-23 01:37:18.132+05:30	2026-07-24 01:38:38.356+05:30	\N	2026-07-24 01:37:18.133193+05:30
12	3	abdebb2103611d92b0ec00b66f99596e0d629c996a095f9521715f415840a81b	1de0e19c-94ea-4858-9cc9-99ae7435436c	2026-08-23 01:38:45.64+05:30	2026-07-24 01:38:53.448+05:30	\N	2026-07-24 01:38:45.641226+05:30
13	2	15174a625c471e597a0ecb87b1e9a87c115622c7b4bcf1a4c7b26ead5e38efd5	24cd3949-9ea5-48fe-b5dd-be79e28c8646	2026-08-23 01:39:56.654+05:30	\N	\N	2026-07-24 01:39:56.655317+05:30
14	4	b1176a24424fc7a0872b2853b695917c1476e042cf32ab26e18173942010dd51	3c74abba-14f8-4b36-957b-6f7e4d2064fb	2026-08-23 01:51:01.996+05:30	2026-07-24 02:08:55.812+05:30	15	2026-07-24 01:51:01.997893+05:30
15	4	300ab2e5ef7744d1d5f652461816aaa9e31c1b98fd514e6618babd31c974c3cb	3c74abba-14f8-4b36-957b-6f7e4d2064fb	2026-08-23 02:08:55.81+05:30	2026-07-24 02:35:42.284+05:30	16	2026-07-24 02:08:55.809273+05:30
16	4	6f190ef7e2daab7098e92f767d00ef96dfecc2f1ecbd955b04311fdc9f223666	3c74abba-14f8-4b36-957b-6f7e4d2064fb	2026-08-23 02:35:42.282+05:30	2026-07-24 02:49:54.092+05:30	\N	2026-07-24 02:35:42.280643+05:30
17	3	797a18b891d0e27b8c6d699a712571f85bcfad2e1ac42e4e791e73f8274575e2	427c36ab-73f4-4433-83be-78a28cd50020	2026-08-23 02:51:23.045+05:30	2026-07-24 02:51:41.388+05:30	\N	2026-07-24 02:51:23.046611+05:30
18	5	ff80be8f8837f23375986198807ab8b15685d389181cdd9532381db7900ed763	43dadcf2-1044-4967-8345-fc48ae4ead87	2026-08-23 02:52:12.055+05:30	2026-07-24 03:07:51.93+05:30	19	2026-07-24 02:52:12.056107+05:30
20	5	190352c8e631aee9499294ffc0f43a47994b5277bb89823f28487252df965bfc	43dadcf2-1044-4967-8345-fc48ae4ead87	2026-08-23 03:25:45.304+05:30	\N	\N	2026-07-24 03:25:45.304242+05:30
19	5	ea2e9ee442bb99486cc0428a5ec88226887a43073d332da582e467b0f9fb8c15	43dadcf2-1044-4967-8345-fc48ae4ead87	2026-08-23 03:07:51.929+05:30	2026-07-24 03:25:45.306+05:30	20	2026-07-24 03:07:51.928972+05:30
\.


--
-- Data for Name: revoked_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revoked_access_tokens (id, token_id, expires_at, created_at) FROM stdin;
1	39e32967-bc26-4d37-9daf-041c19268f3d	2026-07-24 01:52:18+05:30	2026-07-24 01:38:38.361476+05:30
2	e72dbc64-0e20-4bdc-8e33-9196a86be91e	2026-07-24 01:53:45+05:30	2026-07-24 01:38:53.45269+05:30
3	198a9437-2fdc-4e15-be65-1c48d59ed8c6	2026-07-24 02:50:42+05:30	2026-07-24 02:49:54.102184+05:30
4	61d3ef34-1e4a-4c17-a447-3df5700487f8	2026-07-24 03:06:23+05:30	2026-07-24 02:51:41.395115+05:30
\.


--
-- Data for Name: reward_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_transactions (id, user_id, points_delta, reason, reference, created_at) FROM stdin;
1	1	2350	Welcome bonus	WELCOME-1	2026-07-23 22:34:09.659561+05:30
2	2	2350	Welcome bonus	WELCOME-2	2026-07-23 23:49:01.039686+05:30
3	3	2350	Welcome bonus	WELCOME-3	2026-07-24 00:12:49.667769+05:30
4	3	-500	Redeemed: Running gear discount	REDEEM-3-16:points	2026-07-24 01:25:00.377494+05:30
5	4	2350	Welcome bonus	WELCOME-4	2026-07-24 01:50:59.988695+05:30
6	4	-500	Redeemed: Running gear discount	REDEEM-4-16:points	2026-07-24 02:38:36.481442+05:30
7	4	-750	Redeemed: 25% off fan apparel	REDEEM-4-10:points	2026-07-24 02:38:44.587847+05:30
8	5	2350	Welcome bonus	WELCOME-5	2026-07-24 02:52:08.601678+05:30
9	5	-500	Redeemed: Running gear discount	REDEEM-5-16:points	2026-07-24 03:07:54.853304+05:30
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name) FROM stdin;
1	Fan
2	Merchant
\.


--
-- Data for Name: user_cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_cards (id, user_id, card_holder, last4_digits, expiry, card_type, provider, is_default) FROM stdin;
1	1	DAN TEST	4242	12/30	Demo	Visa	t
2	2	RATA TEST	4242	12/30	Demo	Visa	t
3	3	RAM TEST	4242	12/30	Demo	Visa	t
4	4	KESHAV TEST	4242	12/30	Demo	Visa	t
5	5	SAM TEST	4242	12/30	Demo	Visa	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, primary_club_id, followed_club_ids, zip_code, created_at, first_name, last_name, phone_number, role_id, rewlo_cash_balance, rewlo_points, brale_address_id, normalized_email, password_hash, status, brale_account_id, blockchain_address, blockchain_network, wallet_provisioning_status, wallet_provisioning_error, wallet_provisioned_at, updated_at, brale_wallet_id, wallet_provisioning_key) FROM stdin;
3	ram@rewlo.dev	\N	[]	23123	2026-07-24 00:12:49.667769+05:30	Ram	test	\N	1	300	1850	3G94MsNyJdHnLQat7KCXT7WlO04	ram@rewlo.dev	scrypt$43cf5e2d4e4833a043ff2dace0fcfedd$739dc0229b325aa1dac03acce1c3c8c5d63c43dd34f1659ff2121f048db71fd151d6415dbfef9eb97b1ea859ebcaca502886e8468fb2c91f54fce851bb64c059	active	3G94MJwthANtdLBvLNDmEhh2DmQ	0x751E01f416A4AD3157580EA0ee3F65941FBa75B1	base_sepolia	completed	\N	2026-07-24 00:12:51.614+05:30	2026-07-24 01:25:00.38+05:30	3G94MsNyJdHnLQat7KCXT7WlO04	11a696af-590b-4a20-abe7-b54d4cf0b270
4	keshav@rewlo.dev	\N	[]	12312	2026-07-24 01:50:59.988695+05:30	Keshav	test	\N	1	0	1100	3G94MsNyJdHnLQat7KCXT7WlO04	keshav@rewlo.dev	scrypt$3672533db3aa101552a9144eee710a16$5c885569f83db760074e270727cdd919a3103773a7ea2bd77040288f3bab4bfe0640b01c8daff87dd59310a9a76903081b9396061ec96ee5cbd93a126cb9354c	active	3G94MJwthANtdLBvLNDmEhh2DmQ	0x751E01f416A4AD3157580EA0ee3F65941FBa75B1	base_sepolia	completed	\N	2026-07-24 01:51:01.992+05:30	2026-07-24 02:38:44.589+05:30	3G94MsNyJdHnLQat7KCXT7WlO04	1e30a9c3-8f1d-4d6c-bf95-0c8cbf918256
2	rata@rewlo.dev	\N	[]	21312	2026-07-23 23:49:01.039686+05:30	Rata	test	\N	1	200	2350	3G94MsNyJdHnLQat7KCXT7WlO04	rata@rewlo.dev	scrypt$4234deb08e01386eb64a8165acce0aa3$e5835c9dc0e6831d7bcf0c01e42a8dd768e2ce8c9fd6ed4642c9679e86a378a14dc5280b3ac0f39868b960f7d5357c8088c50f613115b09b1a811a6dbfa48e2a	suspended	3G94MJwthANtdLBvLNDmEhh2DmQ	0x751E01f416A4AD3157580EA0ee3F65941FBa75B1	base_sepolia	completed	\N	2026-07-24 00:03:39.505+05:30	2026-07-24 02:30:05.083+05:30	3G94MsNyJdHnLQat7KCXT7WlO04	cac7c73b-22f1-46cf-94c9-81eccef76a53
1	fan@rewlo.dev	\N	[]	23423	2026-07-23 22:34:09.659561+05:30	Dan	test	\N	1	0	2350	\N	fan@rewlo.dev	scrypt$9d992353c80b5892ceb18764476ffc9a$d2d3d50e26be1ced95bd858ebcd54f12031834a1a7481f7fa5ac714ac8fb533a25c243e6abce71b1a038c69807d27c3c5b450adbc3e5849b5b3a5aa4f501c4b1	active	\N	\N	\N	failed	provider_unavailable	\N	2026-07-23 22:49:36.568+05:30	\N	b50d3874-2f13-43ba-9f33-4eaec594c7ae
5	sam@rewlo.dev	\N	[]	21312	2026-07-24 02:52:08.601678+05:30	sam	test	\N	1	200	1850	3G94MsNyJdHnLQat7KCXT7WlO04	sam@rewlo.dev	scrypt$7367ed3086e4fcabef2e447791396312$939ad62092e98b1bc4eb9f651c8a2cce2b1199c968b2fa4042a302b1727f8fdcdbdd1b0bb881e6efad5ca9f78372cbbe4198d5207b47c263ca3062c835a3c906	active	3G94MJwthANtdLBvLNDmEhh2DmQ	0x751E01f416A4AD3157580EA0ee3F65941FBa75B1	base_sepolia	completed	\N	2026-07-24 02:52:12.051+05:30	2026-07-24 03:26:14.057+05:30	3G94MsNyJdHnLQat7KCXT7WlO04	cb5be586-f6b0-4e3c-8902-1dccb5f53b3a
\.


--
-- Data for Name: wallet_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.wallet_transactions (id, user_id, related_user_id, merchant_id, type, status, amount_cents, currency, reward_points_delta, reference, external_transaction_id, blockchain_hash, description, metadata, created_at) FROM stdin;
3	3	\N	\N	top_up	completed	100	USD	0	62b2eb70-0df3-4198-a4c3-ffce81c5e03c:topup	3GurESkOxnWqXjluCXKa4QSNWsy	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3GurESkOxnWqXjluCXKa4QSNWsy", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T18:43:02.202028Z", "updated_at": "2026-07-23T18:43:02.202028Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 00:13:02.199327+05:30
5	3	\N	\N	top_up	completed	100	USD	0	9eb4a2fc-b84a-4717-aa55-3ae1f696a64d:topup	3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T18:57:38.014433Z", "updated_at": "2026-07-23T18:57:38.014433Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 00:30:19.68151+05:30
7	3	\N	\N	top_up	completed	100	USD	0	f5dc8789-17b5-4a4f-b99e-bd98d560faef:topup	3GutOEqq1XMbaz9hW0L9GpnhERj	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3GutOEqq1XMbaz9hW0L9GpnhERj", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T19:00:47.270671Z", "updated_at": "2026-07-23T19:00:47.270671Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 00:30:47.189942+05:30
8	3	\N	\N	status_check	completed	100	USD	0	8f8d9e12-76d0-4c94-bf60-761b6d884bc1	3GurESkOxnWqXjluCXKa4QSNWsy	\N	Brale status check	{"request": {"transactionId": "3GurESkOxnWqXjluCXKa4QSNWsy"}, "provider": "brale", "response": {"id": "3GurESkOxnWqXjluCXKa4QSNWsy", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T18:43:02.202028Z", "updated_at": "2026-07-23T18:43:09.885791Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0xc25dab68f3f7ab0abbe91c79b4a205b6e96988a4a0c3cbb6992f5b8859fa199a"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:48:18.21594+05:30
2	3	\N	\N	mint	completed	100	USD	0	62b2eb70-0df3-4198-a4c3-ffce81c5e03c	3GurESkOxnWqXjluCXKa4QSNWsy	\N	Brale mint	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3GurESkOxnWqXjluCXKa4QSNWsy", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T18:43:02.202028Z", "updated_at": "2026-07-23T18:43:02.202028Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:13:02.196762+05:30
9	3	\N	\N	status_check	completed	100	USD	0	ae030f1a-ee7e-43ce-9bdc-5cfc298074b2	3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza	\N	Brale status check	{"request": {"transactionId": "3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza"}, "provider": "brale", "response": {"id": "3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T18:57:38.014433Z", "updated_at": "2026-07-23T18:57:50.456354Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0xe89714b3cf2b1b5d8a0b7b6f36b34152a9fad5bb23fa435172b30ce82d5221e2"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:48:18.561382+05:30
4	3	\N	\N	mint	completed	100	USD	0	9eb4a2fc-b84a-4717-aa55-3ae1f696a64d	3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza	\N	Brale mint	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Gut0Y7qJ6Wtn0HFvwhF8T6Gyza", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T18:57:38.014433Z", "updated_at": "2026-07-23T18:57:38.014433Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:27:37.962001+05:30
6	3	\N	\N	mint	completed	100	USD	0	f5dc8789-17b5-4a4f-b99e-bd98d560faef	3GutOEqq1XMbaz9hW0L9GpnhERj	\N	Brale mint	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3GutOEqq1XMbaz9hW0L9GpnhERj", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T19:00:47.270671Z", "updated_at": "2026-07-23T19:00:47.270671Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:30:47.187318+05:30
1	2	\N	\N	mint	completed	200	USD	0	459b487a-1640-4adb-8e62-28f6fda7890a	3Guq5lZiULq6y19uktU72Y9ljoD	\N	Brale mint	{"request": {"amount": {"value": "2.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Guq5lZiULq6y19uktU72Y9ljoD", "note": null, "amount": {"value": "2.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T18:33:40.172317Z", "updated_at": "2026-07-23T18:33:40.172317Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:03:40.177976+05:30
10	3	\N	\N	status_check	completed	100	USD	0	b8a41995-ae21-4e65-b9f4-a9f9211d0a41	3GutOEqq1XMbaz9hW0L9GpnhERj	\N	Brale status check	{"request": {"transactionId": "3GutOEqq1XMbaz9hW0L9GpnhERj"}, "provider": "brale", "response": {"id": "3GutOEqq1XMbaz9hW0L9GpnhERj", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T19:00:47.270671Z", "updated_at": "2026-07-23T19:00:55.845938Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0x0ba74de47276cd5acd1cc3ea3cf65cd058ab0867baa0a387373dd8c8e2f697ac"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 00:48:18.857399+05:30
11	3	\N	\N	redeem	pending	100	USD	0	ea386371-f7fa-4c19-beba-622bbd42b77f	3Guxvn51vs8v1SCbG9opcLWUbLH	\N	Brale redeem	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"value_type": "USD", "transfer_type": "wire"}}, "provider": "brale", "response": {"id": "3Guxvn51vs8v1SCbG9opcLWUbLH", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T19:38:07.779777Z", "updated_at": "2026-07-23T19:38:07.779777Z", "destination": null, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 01:08:07.621063+05:30
12	3	\N	\N	redeem	pending	100	USD	0	REDEEM-3-16	3Guzz0hingiBQfuI7yGT9StF1VL	\N	Brale redeem	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"value_type": "USD", "transfer_type": "wire"}}, "provider": "brale", "response": {"id": "3Guzz0hingiBQfuI7yGT9StF1VL", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T19:55:00.599181Z", "updated_at": "2026-07-23T19:55:00.599181Z", "destination": null, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 01:25:00.373102+05:30
14	2	\N	\N	top_up	completed	200	USD	0	e361a25c-ba79-4532-ac66-69169ea0d254:topup	3Gv1t4NO5qsA6qpHtzFNcxWzLYH	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3Gv1t4NO5qsA6qpHtzFNcxWzLYH", "note": null, "amount": {"value": "2.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T20:10:39.911006Z", "updated_at": "2026-07-23T20:10:39.911006Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 01:40:39.666163+05:30
15	2	\N	\N	status_check	completed	200	USD	0	05693553-8ae4-49f2-bf18-dc25a3e628e6	3Guq5lZiULq6y19uktU72Y9ljoD	\N	Brale status check	{"request": {"transactionId": "3Guq5lZiULq6y19uktU72Y9ljoD"}, "provider": "brale", "response": {"id": "3Guq5lZiULq6y19uktU72Y9ljoD", "note": null, "amount": {"value": "2.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T18:33:40.172317Z", "updated_at": "2026-07-23T18:33:47.774741Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0x09579aa93670c03ea62436652aa12ad5ae77869d8587c63ae8963cc3519ef94d"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 01:41:45.305718+05:30
16	2	\N	\N	status_check	completed	200	USD	0	537e505a-e4dc-4e67-aaf8-fd64b1969151	3Gv1t4NO5qsA6qpHtzFNcxWzLYH	\N	Brale status check	{"request": {"transactionId": "3Gv1t4NO5qsA6qpHtzFNcxWzLYH"}, "provider": "brale", "response": {"id": "3Gv1t4NO5qsA6qpHtzFNcxWzLYH", "note": null, "amount": {"value": "2.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T20:10:39.911006Z", "updated_at": "2026-07-23T20:10:47.206011Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0x9dee1725095e0f3ab1f1c1ef791b95f1c72af1335c1cf0742ab46f42dd3225d0"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 01:41:45.603174+05:30
13	2	\N	\N	mint	completed	200	USD	0	e361a25c-ba79-4532-ac66-69169ea0d254	3Gv1t4NO5qsA6qpHtzFNcxWzLYH	\N	Brale mint	{"request": {"amount": {"value": "2.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Gv1t4NO5qsA6qpHtzFNcxWzLYH", "note": null, "amount": {"value": "2.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T20:10:39.911006Z", "updated_at": "2026-07-23T20:10:39.911006Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 01:40:39.661327+05:30
17	4	\N	\N	mint	pending	100	USD	0	3f774519-0c2b-44f2-9d16-d7e9bf932668	3Gv5kY1S8lonaoptiOWacEkCdIP	\N	Brale mint	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Gv5kY1S8lonaoptiOWacEkCdIP", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T20:42:25.955374Z", "updated_at": "2026-07-23T20:42:25.955374Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:12:25.638522+05:30
18	4	\N	\N	top_up	completed	100	USD	0	3f774519-0c2b-44f2-9d16-d7e9bf932668:topup	3Gv5kY1S8lonaoptiOWacEkCdIP	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3Gv5kY1S8lonaoptiOWacEkCdIP", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T20:42:25.955374Z", "updated_at": "2026-07-23T20:42:25.955374Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 02:12:25.642855+05:30
19	4	\N	\N	mint	pending	100	USD	0	eabaccb3-515b-4af5-b4a8-e688fb23fca6	3Gv6JVYpmkyjVv4NDguq6bmmAAb	\N	Brale mint	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Gv6JVYpmkyjVv4NDguq6bmmAAb", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T20:47:03.618213Z", "updated_at": "2026-07-23T20:47:03.618213Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:17:03.297233+05:30
20	4	\N	\N	top_up	completed	100	USD	0	eabaccb3-515b-4af5-b4a8-e688fb23fca6:topup	3Gv6JVYpmkyjVv4NDguq6bmmAAb	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3Gv6JVYpmkyjVv4NDguq6bmmAAb", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T20:47:03.618213Z", "updated_at": "2026-07-23T20:47:03.618213Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 02:17:03.301589+05:30
21	4	\N	\N	transfer	pending	100	USD	0	6dacaaf8-9caf-453d-9b7f-3d5f803f6cbf	3Gv8c8W2SS8Sy4qyknLQV6fXZfd	\N	Brale transfer	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Gv8c8W2SS8Sy4qyknLQV6fXZfd", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:05:58.898664Z", "updated_at": "2026-07-23T21:05:58.898664Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:35:58.547575+05:30
22	4	\N	4	merchant_payment	completed	-100	USD	0	6dacaaf8-9caf-453d-9b7f-3d5f803f6cbf:payment	3Gv8c8W2SS8Sy4qyknLQV6fXZfd	\N	Payment to Liverpool FC Retail	{"provider": "brale", "braleResponse": {"id": "3Gv8c8W2SS8Sy4qyknLQV6fXZfd", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:05:58.898664Z", "updated_at": "2026-07-23T21:05:58.898664Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 02:35:58.55764+05:30
23	4	\N	\N	transfer	pending	100	USD	0	acc72d0f-599c-4537-a7d2-70a4e05a256e	3Gv8tZX43ArMWOU0oCEesjVyTVD	\N	Brale transfer	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3Gv8tZX43ArMWOU0oCEesjVyTVD", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:08:17.072020Z", "updated_at": "2026-07-23T21:08:17.072020Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:38:16.682544+05:30
24	4	\N	4	merchant_payment	completed	-100	USD	0	acc72d0f-599c-4537-a7d2-70a4e05a256e:payment	3Gv8tZX43ArMWOU0oCEesjVyTVD	\N	Payment to Liverpool FC Retail	{"provider": "brale", "braleResponse": {"id": "3Gv8tZX43ArMWOU0oCEesjVyTVD", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:08:17.072020Z", "updated_at": "2026-07-23T21:08:17.072020Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 02:38:16.6886+05:30
25	4	\N	\N	redeem	pending	100	USD	0	REDEEM-4-16	3Gv8vxUGJtcEltI81yGtaaVdJrH	\N	Brale redeem	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"value_type": "USD", "transfer_type": "wire"}}, "provider": "brale", "response": {"id": "3Gv8vxUGJtcEltI81yGtaaVdJrH", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:08:36.859883Z", "updated_at": "2026-07-23T21:08:36.859883Z", "destination": null, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:38:36.478066+05:30
26	4	\N	\N	redeem	pending	100	USD	0	REDEEM-4-10	3Gv8x12lBIkpESDAOUgDfpbKKJs	\N	Brale redeem	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"value_type": "USD", "transfer_type": "wire"}}, "provider": "brale", "response": {"id": "3Gv8x12lBIkpESDAOUgDfpbKKJs", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:08:44.968257Z", "updated_at": "2026-07-23T21:08:44.968257Z", "destination": null, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:38:44.58353+05:30
28	5	\N	\N	top_up	completed	300	USD	0	48c7f3ff-1dd5-483a-851f-645a3b8988e9:topup	3GvAhaCxYioKMd5pzNIbysFnRGg	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3GvAhaCxYioKMd5pzNIbysFnRGg", "note": null, "amount": {"value": "3.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T21:23:08.983751Z", "updated_at": "2026-07-23T21:23:08.983751Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 02:53:08.588142+05:30
29	5	\N	\N	status_check	completed	300	USD	0	eba751f2-4aac-4481-86a7-b41dee1a187e	3GvAhaCxYioKMd5pzNIbysFnRGg	\N	Brale status check	{"request": {"transactionId": "3GvAhaCxYioKMd5pzNIbysFnRGg"}, "provider": "brale", "response": {"id": "3GvAhaCxYioKMd5pzNIbysFnRGg", "note": null, "amount": {"value": "3.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T21:23:08.983751Z", "updated_at": "2026-07-23T21:23:34.928666Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0xe436ce7bcf18d43f844adc191eadf6836276c08c2bcf4617db5014d4f97bb2a5"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:55:19.447371+05:30
27	5	\N	\N	mint	completed	300	USD	0	48c7f3ff-1dd5-483a-851f-645a3b8988e9	3GvAhaCxYioKMd5pzNIbysFnRGg	\N	Brale mint	{"request": {"amount": {"value": "3.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3GvAhaCxYioKMd5pzNIbysFnRGg", "note": null, "amount": {"value": "3.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T21:23:08.983751Z", "updated_at": "2026-07-23T21:23:08.983751Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:53:08.586777+05:30
30	5	\N	\N	transfer	pending	100	USD	0	9b2126d7-d3b0-41bd-8a02-03735b0bf538	3GvB6yWc9oUYZamPOh43p8XvLiG	\N	Brale transfer	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3GvB6yWc9oUYZamPOh43p8XvLiG", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:26:30.897779Z", "updated_at": "2026-07-23T21:26:30.897779Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 02:56:30.481764+05:30
31	5	\N	4	merchant_payment	completed	-100	USD	0	9b2126d7-d3b0-41bd-8a02-03735b0bf538:payment	3GvB6yWc9oUYZamPOh43p8XvLiG	\N	Payment to Liverpool FC Retail	{"provider": "brale", "braleResponse": {"id": "3GvB6yWc9oUYZamPOh43p8XvLiG", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:26:30.897779Z", "updated_at": "2026-07-23T21:26:30.897779Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 02:56:30.485594+05:30
33	5	\N	\N	top_up	completed	100	USD	0	fe1a61c4-096e-49ab-9e79-d5210046f446:topup	3GvBgo2GnlboNbMKp7jbH0foYBI	\N	Top up · Visa •••• 4242	{"demoCard": true, "provider": "brale", "braleResponse": {"id": "3GvBgo2GnlboNbMKp7jbH0foYBI", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T21:31:15.755206Z", "updated_at": "2026-07-23T21:31:15.755206Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 03:01:15.3242+05:30
34	5	\N	\N	status_check	pending	100	USD	0	bd853688-d809-49a5-803d-4a68b5f60eac	3GvBgo2GnlboNbMKp7jbH0foYBI	\N	Brale status check	{"request": {"transactionId": "3GvBgo2GnlboNbMKp7jbH0foYBI"}, "provider": "brale", "response": {"id": "3GvBgo2GnlboNbMKp7jbH0foYBI", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "processing", "failure": null, "created_at": "2026-07-23T21:31:15.755206Z", "updated_at": "2026-07-23T21:31:17.301431Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 03:01:23.358961+05:30
35	5	\N	\N	redeem	pending	100	USD	0	REDEEM-5-16	3GvCUxv9lOiaZuIWYV883xnxq5n	\N	Brale redeem	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"value_type": "USD", "transfer_type": "wire"}}, "provider": "brale", "response": {"id": "3GvCUxv9lOiaZuIWYV883xnxq5n", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:37:55.041174Z", "updated_at": "2026-07-23T21:37:55.041174Z", "destination": null, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 03:07:54.850594+05:30
36	5	\N	\N	transfer	pending	100	USD	0	c2ef7d18-cbec-487e-9c81-b5d37f0480e0	3GvEj7opY0SGKR9BKJdNSML6KUE	\N	Brale transfer	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3GvEj7opY0SGKR9BKJdNSML6KUE", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:56:14.544955Z", "updated_at": "2026-07-23T21:56:14.544955Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 03:26:14.054108+05:30
37	5	\N	4	merchant_payment	completed	-100	USD	0	c2ef7d18-cbec-487e-9c81-b5d37f0480e0:payment	3GvEj7opY0SGKR9BKJdNSML6KUE	\N	Payment to Liverpool FC Retail	{"provider": "brale", "braleResponse": {"id": "3GvEj7opY0SGKR9BKJdNSML6KUE", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "status": "pending", "failure": null, "created_at": "2026-07-23T21:56:14.544955Z", "updated_at": "2026-07-23T21:56:14.544955Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}}	2026-07-24 03:26:14.05623+05:30
38	5	\N	\N	status_check	completed	100	USD	0	444cf5ca-5d99-4364-9773-376727165b16	3GvBgo2GnlboNbMKp7jbH0foYBI	\N	Brale status check	{"request": {"transactionId": "3GvBgo2GnlboNbMKp7jbH0foYBI"}, "provider": "brale", "response": {"id": "3GvBgo2GnlboNbMKp7jbH0foYBI", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "complete", "failure": null, "created_at": "2026-07-23T21:31:15.755206Z", "updated_at": "2026-07-23T21:31:24.161893Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia", "transaction_id": "0x31c8c5d7ff217b002ae120c139d00f18778281fe32fb781aaee69edfda072950"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 03:31:08.056468+05:30
32	5	\N	\N	mint	completed	100	USD	0	fe1a61c4-096e-49ab-9e79-d5210046f446	3GvBgo2GnlboNbMKp7jbH0foYBI	\N	Brale mint	{"request": {"amount": {"value": "1.00", "currency": "USD"}, "source": {"value_type": "USD", "transfer_type": "wire"}, "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}}, "provider": "brale", "response": {"id": "3GvBgo2GnlboNbMKp7jbH0foYBI", "note": null, "amount": {"value": "1.00", "currency": "USD"}, "source": null, "status": "pending", "failure": null, "created_at": "2026-07-23T21:31:15.755206Z", "updated_at": "2026-07-23T21:31:15.755206Z", "destination": {"address_id": "3G94MsNyJdHnLQat7KCXT7WlO04", "value_type": "SBC", "transfer_type": "base_sepolia"}, "funding_simulated": null}, "environment": "testnet"}	2026-07-24 03:01:15.312894+05:30
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 11, true);


--
-- Name: merchants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.merchants_id_seq', 20, true);


--
-- Name: offer_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.offer_categories_id_seq', 8, true);


--
-- Name: offer_redemptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.offer_redemptions_id_seq', 4, true);


--
-- Name: offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.offers_id_seq', 20, true);


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_requests_id_seq', 1, false);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 20, true);


--
-- Name: revoked_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.revoked_access_tokens_id_seq', 4, true);


--
-- Name: reward_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reward_transactions_id_seq', 9, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 8, true);


--
-- Name: user_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_cards_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: wallet_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.wallet_transactions_id_seq', 38, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (key);


--
-- Name: merchants merchants_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_email_key UNIQUE (email);


--
-- Name: merchants merchants_merchant_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_merchant_code_key UNIQUE (merchant_code);


--
-- Name: merchants merchants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);


--
-- Name: offer_categories offer_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_categories
    ADD CONSTRAINT offer_categories_name_key UNIQUE (name);


--
-- Name: offer_categories offer_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_categories
    ADD CONSTRAINT offer_categories_pkey PRIMARY KEY (id);


--
-- Name: offer_redemptions offer_redemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_redemptions
    ADD CONSTRAINT offer_redemptions_pkey PRIMARY KEY (id);


--
-- Name: offer_redemptions offer_redemptions_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_redemptions
    ADD CONSTRAINT offer_redemptions_reference_key UNIQUE (reference);


--
-- Name: offers offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: revoked_access_tokens revoked_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revoked_access_tokens
    ADD CONSTRAINT revoked_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: reward_transactions reward_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_transactions
    ADD CONSTRAINT reward_transactions_pkey PRIMARY KEY (id);


--
-- Name: reward_transactions reward_transactions_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_transactions
    ADD CONSTRAINT reward_transactions_reference_key UNIQUE (reference);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_cards user_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cards
    ADD CONSTRAINT user_cards_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: wallet_transactions wallet_transactions_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_reference_key UNIQUE (reference);


--
-- Name: merchants_blockchain_network_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX merchants_blockchain_network_idx ON public.merchants USING btree (blockchain_network);


--
-- Name: merchants_brale_address_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX merchants_brale_address_id_unique ON public.merchants USING btree (brale_address_id);


--
-- Name: merchants_wallet_provisioning_key_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX merchants_wallet_provisioning_key_unique ON public.merchants USING btree (wallet_provisioning_key) WHERE (wallet_provisioning_key IS NOT NULL);


--
-- Name: merchants_wallet_provisioning_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX merchants_wallet_provisioning_status_idx ON public.merchants USING btree (wallet_provisioning_status);


--
-- Name: offer_redemptions_user_offer_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX offer_redemptions_user_offer_unique ON public.offer_redemptions USING btree (user_id, offer_id);


--
-- Name: password_reset_requests_email_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_requests_email_created_at_idx ON public.password_reset_requests USING btree (normalized_email, created_at);


--
-- Name: password_reset_tokens_token_hash_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX password_reset_tokens_token_hash_unique ON public.password_reset_tokens USING btree (token_hash);


--
-- Name: password_reset_tokens_user_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX password_reset_tokens_user_expires_at_idx ON public.password_reset_tokens USING btree (user_id, expires_at);


--
-- Name: refresh_tokens_family_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_family_created_at_idx ON public.refresh_tokens USING btree (token_family, created_at);


--
-- Name: refresh_tokens_token_hash_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX refresh_tokens_token_hash_unique ON public.refresh_tokens USING btree (token_hash);


--
-- Name: refresh_tokens_user_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_user_expires_at_idx ON public.refresh_tokens USING btree (user_id, expires_at);


--
-- Name: revoked_access_tokens_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX revoked_access_tokens_expires_at_idx ON public.revoked_access_tokens USING btree (expires_at);


--
-- Name: revoked_access_tokens_token_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX revoked_access_tokens_token_id_unique ON public.revoked_access_tokens USING btree (token_id);


--
-- Name: reward_transactions_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reward_transactions_user_created_idx ON public.reward_transactions USING btree (user_id, created_at);


--
-- Name: user_cards_one_default_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_cards_one_default_per_user ON public.user_cards USING btree (user_id) WHERE is_default;


--
-- Name: users_blockchain_network_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_blockchain_network_idx ON public.users USING btree (blockchain_network);


--
-- Name: users_normalized_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_normalized_email_unique ON public.users USING btree (normalized_email);


--
-- Name: users_role_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_id_idx ON public.users USING btree (role_id);


--
-- Name: users_wallet_provisioning_key_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_wallet_provisioning_key_unique ON public.users USING btree (wallet_provisioning_key) WHERE (wallet_provisioning_key IS NOT NULL);


--
-- Name: users_wallet_provisioning_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_wallet_provisioning_status_idx ON public.users USING btree (wallet_provisioning_status);


--
-- Name: wallet_transactions_merchant_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wallet_transactions_merchant_created_at_idx ON public.wallet_transactions USING btree (merchant_id, created_at);


--
-- Name: wallet_transactions_related_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wallet_transactions_related_user_idx ON public.wallet_transactions USING btree (related_user_id);


--
-- Name: wallet_transactions_user_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wallet_transactions_user_created_at_idx ON public.wallet_transactions USING btree (user_id, created_at);


--
-- Name: offer_redemptions offer_redemptions_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_redemptions
    ADD CONSTRAINT offer_redemptions_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offers(id);


--
-- Name: offer_redemptions offer_redemptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offer_redemptions
    ADD CONSTRAINT offer_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offers offers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT offers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.offer_categories(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_replaced_by_token_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_replaced_by_token_id_fkey FOREIGN KEY (replaced_by_token_id) REFERENCES public.refresh_tokens(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reward_transactions reward_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_transactions
    ADD CONSTRAINT reward_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_cards user_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cards
    ADD CONSTRAINT user_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_roles_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: wallet_transactions wallet_transactions_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_related_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_related_user_id_fkey FOREIGN KEY (related_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: wallet_transactions wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict gUVr2akF3WThUY04kKjqg528o5WC9Efsoknz2VOvsOsCTN39LQ1a3Em3ZFxMINc

