import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "./route";

test("google auth route redirects with a 302 to the OAuth provider", async () => {
  process.env.GOOGLE_CLIENT_ID = "test-client-id";

  const response = await GET(new Request("http://localhost:3000/api/auth/google?next=%2Faccount"));

  assert.equal(response.status, 302, "expected a 302 redirect for OAuth initiation");
  assert.match(response.headers.get("location") ?? "", /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  assert.match(response.headers.get("set-cookie") ?? "", /golden_google_state/);
});
