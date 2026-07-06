const { execSync } = require("child_process");
const path = require("path");

const actions = [
  "actions/twilio/webhook-validator",
  "actions/stripe/webhook-validator",
  "actions/aws/cloudfront-invalidation",
];

for (const action of actions) {
  const src = path.join(action, "index.js");
  const out = path.join(action, "dist");
  console.log(`Building ${action}...`);
  execSync(`npx ncc build ${src} -o ${out} --minify`, { stdio: "inherit" });
}

console.log("All actions built successfully.");
