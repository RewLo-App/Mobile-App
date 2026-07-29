# Mobile build environment

The EAS `production` environment must define these plain-text variables before a
TestFlight or App Store build:

```text
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://homefield-pay--sumit6454.replit.app/api/v1
```

`EXPO_PUBLIC_API_URL` is the complete, versioned API base URL. Define `/api/v1`
in this one variable; application code does not add the protocol or version
prefix from any deployment-domain variable.

Set them in the Expo dashboard under **EAS > Environment variables > production**
or with:

```sh
eas env:create --environment production --name EXPO_PUBLIC_APP_ENV --value production --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://homefield-pay--sumit6454.replit.app/api/v1 --visibility plaintext
```

The production EAS profile selects this environment and stops before install if
the API URL is missing, is not HTTPS, or does not end in `/api/v1`.

## Local development

Create an untracked `.env.local` from `.env.example`:

```text
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

`localhost` works only when the app runtime can reach the API on the same
computer, such as a web browser or iOS Simulator. A physical phone interprets
`localhost` as the phone itself, so replace it with the development computer's
LAN IP:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/api/v1
```

The phone and computer must be on the same network, and the API must listen on
an interface reachable from that network.
