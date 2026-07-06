const crypto = require("crypto");
const https = require("https");
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

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function getSignatureKey(secretKey, dateStamp, region, service) {
  const kDate = hmac("AWS4" + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function signRequest(method, host, path, body, region, accessKey, secretKey) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const dateStamp = amzDate.slice(0, 8);
  const service = "cloudfront";

  const payloadHash = sha256(body);

  const headers = {
    host: host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    "content-type": "application/xml",
  };

  const signedHeaderKeys = Object.keys(headers).sort();
  const signedHeaders = signedHeaderKeys.join(";");
  const canonicalHeaders = signedHeaderKeys
    .map((k) => `${k}:${headers[k]}\n`)
    .join("");

  const canonicalRequest = [
    method,
    path,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { ...headers, authorization };
}

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const accessKey = getInput("AWS_ACCESS_KEY_ID");
  const secretKey = getInput("AWS_SECRET_ACCESS_KEY");
  const region = getInput("AWS_REGION") || "us-east-1";
  const distributionId = getInput("DISTRIBUTION_ID");
  const pathsInput = getInput("PATHS");
  const callerReference =
    getInput("CALLER_REFERENCE") || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!accessKey) { setFailed("AWS_ACCESS_KEY_ID is required"); return; }
  if (!secretKey) { setFailed("AWS_SECRET_ACCESS_KEY is required"); return; }
  if (!distributionId) { setFailed("DISTRIBUTION_ID is required"); return; }
  if (!pathsInput) { setFailed("PATHS is required"); return; }

  const paths = pathsInput.split(",").map((p) => p.trim()).filter(Boolean);
  if (paths.length === 0) { setFailed("At least one path is required"); return; }

  const pathItems = paths.map((p) => `      <Path>${p}</Path>`).join("\n");
  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<InvalidationBatch xmlns="http://cloudfront.amazonaws.com/doc/2020-05-31/">
  <CallerReference>${callerReference}</CallerReference>
  <Paths>
    <Quantity>${paths.length}</Quantity>
    <Items>
${pathItems}
    </Items>
  </Paths>
</InvalidationBatch>`;

  const host = "cloudfront.amazonaws.com";
  const urlPath = `/2020-05-31/distribution/${distributionId}/invalidation`;

  const headers = signRequest("POST", host, urlPath, xmlBody, region, accessKey, secretKey);

  console.log(`Creating invalidation for distribution ${distributionId} with ${paths.length} path(s)`);

  const response = await httpRequest(
    {
      hostname: host,
      port: 443,
      path: urlPath,
      method: "POST",
      headers: headers,
    },
    xmlBody
  );

  if (response.statusCode !== 201 && response.statusCode !== 200) {
    setFailed(`CloudFront API returned ${response.statusCode}: ${response.body}`);
    return;
  }

  const idMatch = response.body.match(/<Id>([^<]+)<\/Id>/);
  const statusMatch = response.body.match(/<Status>([^<]+)<\/Status>/);

  const invalidationId = idMatch ? idMatch[1] : "unknown";
  const status = statusMatch ? statusMatch[1] : "unknown";

  console.log(`Invalidation created: ${invalidationId} (${status})`);

  setOutput("invalidation_id", invalidationId);
  setOutput("status", status);
}

run().catch((err) => setFailed(err.message));
