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

// Twilio signature validation per https://www.twilio.com/docs/usage/webhooks/webhooks-security
// 1. Take the full URL of the request
// 2. Sort all POST parameters alphabetically by name
// 3. Concatenate the full URL + sorted params (key + value, no separator)
// 4. HMAC-SHA1 with your auth token, then base64 encode
function validateTwilioSignature(authToken, url, params, signature) {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }

  const computed = crypto
    .createHmac("sha1", authToken)
    .update(data)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(computed),
    Buffer.from(signature)
  );
}

function run() {
  const rawBody = getInput("body");
  const headersRaw = getInput("headers");
  const url = getInput("url");
  const authToken = getInput("TWILIO_AUTH_TOKEN");

  if (!authToken) {
    setFailed("TWILIO_AUTH_TOKEN secret is required");
    return;
  }

  let headers;
  try {
    headers = typeof headersRaw === "string" ? JSON.parse(headersRaw) : headersRaw;
  } catch {
    setFailed("Failed to parse headers");
    return;
  }

  const signature =
    headers["X-Twilio-Signature"] ||
    headers["x-twilio-signature"] ||
    "";

  if (!signature) {
    setFailed("Missing X-Twilio-Signature header");
    return;
  }

  // Parse form-encoded body into params object
  const params = {};
  if (rawBody) {
    for (const pair of rawBody.split("&")) {
      const [key, ...rest] = pair.split("=");
      if (key) {
        params[decodeURIComponent(key)] = decodeURIComponent(rest.join("="));
      }
    }
  }

  try {
    const valid = validateTwilioSignature(authToken, url, params, signature);
    if (!valid) {
      setFailed("Invalid Twilio signature");
      return;
    }
  } catch (err) {
    setFailed(`Signature validation error: ${err.message}`);
    return;
  }

  setOutput("valid", "true");
}

run();
