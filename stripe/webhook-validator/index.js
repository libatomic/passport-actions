const crypto = require("crypto");
const { appendFileSync } = require("fs");

function getInput(name) {
  return process.env[`INPUT_${name.toUpperCase().replace(/ /g, "_")}`] || "";
}

function setOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `${name}=${value}\n`);
  }
}

function setFailed(message) {
  process.stdout.write(`::error::${message}\n`);
  process.exitCode = 1;
}

// Stripe signature validation per https://docs.stripe.com/webhooks#verify-webhook-signatures
// The Stripe-Signature header format: t=<timestamp>,v1=<signature>[,v1=<signature>...]
// 1. Extract the timestamp and signatures from the header
// 2. Prepare the signed payload: <timestamp>.<body>
// 3. Compute HMAC-SHA256 with the endpoint secret
// 4. Compare against each v1 signature (constant-time)
// 5. Optionally check timestamp tolerance
function validateStripeSignature(secret, body, sigHeader, tolerance) {
  const elements = sigHeader.split(",");
  let timestamp = null;
  const signatures = [];

  for (const element of elements) {
    const [key, value] = element.split("=", 2);
    if (key === "t") {
      timestamp = parseInt(value, 10);
    } else if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return { valid: false, error: "Invalid Stripe-Signature header format" };
  }

  // Check timestamp tolerance
  if (tolerance > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > tolerance) {
      return { valid: false, error: "Webhook timestamp too old" };
    }
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  // Check against all v1 signatures (Stripe may include multiple during key rotation)
  for (const sig of signatures) {
    try {
      if (
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
      ) {
        return { valid: true };
      }
    } catch {
      continue;
    }
  }

  return { valid: false, error: "Signature mismatch" };
}

function run() {
  const body = getInput("body");
  const headersRaw = getInput("headers");
  const secret = getInput("STRIPE_WEBHOOK_SECRET");
  const tolerance = parseInt(getInput("tolerance") || "300", 10);

  if (!secret) {
    setFailed("STRIPE_WEBHOOK_SECRET secret is required");
    return;
  }

  let headers;
  try {
    headers = typeof headersRaw === "string" ? JSON.parse(headersRaw) : headersRaw;
  } catch {
    setFailed("Failed to parse headers");
    return;
  }

  const sigHeader =
    headers["Stripe-Signature"] ||
    headers["stripe-signature"] ||
    "";

  if (!sigHeader) {
    setFailed("Missing Stripe-Signature header");
    return;
  }

  const result = validateStripeSignature(secret, body, sigHeader, tolerance);
  if (!result.valid) {
    setFailed(result.error || "Invalid Stripe signature");
    return;
  }

  setOutput("valid", "true");
}

run();
