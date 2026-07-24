# Mobile build environment

The EAS `production` environment must define these plain-text variables before a
TestFlight or App Store build:

```text
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://your-public-api.example.com
```

`EXPO_PUBLIC_API_URL` must be the public HTTPS origin of the API (without
`/api/v1`). The mobile client adds `/api/v1` itself.

Set them in the Expo dashboard under **EAS > Environment variables > production**
or with:

```sh
eas env:create --environment production --name EXPO_PUBLIC_APP_ENV --value production --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://your-public-api.example.com --visibility plaintext
```

The production EAS profile selects this environment and stops before install if
the API URL is missing or is not HTTPS. Keep localhost URLs only in untracked
local development environment files.
