# App Store submission checklist

Complete these fields in **App Store Connect** before submitting the iOS build.

## Required metadata

| Field | Release value |
| --- | --- |
| App name | RewLo |
| Subtitle | Sports Fan Wallet |
| Primary category | Finance |
| Secondary category | Sports |
| Support URL | `https://rewlo.io/support.html` |
| Privacy policy URL | `https://rewlo.io/privacy.html` |
| Age rating | Complete Apple’s questionnaire based on the final enabled features; do not guess. |

## Screenshots

Upload current device screenshots for every required iPhone display size. Include:

1. Wallet home and balance
2. Rewlo Premium card
3. Rewards catalog
4. Merchant QR scan/payment confirmation
5. Profile and account deletion entry point

Do not include prototype, demo, testnet, placeholder, or fabricated-payment copy.

## Privacy labels

Complete Apple’s privacy questionnaire from the final data inventory and privacy
policy. Confirm collection, purpose, and linkage for account identity, contact
details, financial/wallet activity, diagnostics, and any analytics or third-party
SDK data. The answers must match the shipped build and `privacy.html`.

## App Review notes

Use a live, non-production test account and keep its credentials current:

```text
Test account email: <set in App Store Connect>
Test account password: <set in App Store Connect>
```

Suggested review note:

```text
RewLo is a sports fan wallet. QR scanning is used only to scan participating
merchant payment and rewards QR codes. It does not scan government IDs,
documents, or unrelated barcodes. The account-deletion flow is available at
Profile > Delete Account and deletes associated app data after confirmation.
```

Before submission, verify the test account can sign in against the public HTTPS
production API and that all reviewer-visible payment/reward actions use real,
approved backend flows.

## Build toolchain

Use the `production` EAS profile for App Store builds. It pins the EAS iOS image
`macos-sequoia-15.6-xcode-26.0`, which includes Xcode 26 and the iOS 26 SDK.
