# Vercel firewall

These JSON payloads are applied to the Vercel Firewall configuration endpoint.
They are intentionally scoped to the two Gemini-backed generation routes.

Apply a payload with:

```sh
vercel api "/v1/security/firewall/config?projectId=$VERCEL_PROJECT_ID&teamId=$VERCEL_TEAM_ID" \
  --method PATCH --input ops/vercel/ai-rate-limit.json --token "$VERCEL_TOKEN"
```

Always read the active configuration first and avoid inserting duplicate rules.
