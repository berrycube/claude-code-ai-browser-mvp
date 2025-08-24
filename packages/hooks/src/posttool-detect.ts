// Backward compatibility wrapper for posttool-detect
import { executePostToolDetect } from "./index.js";

async function main() {
  await executePostToolDetect();
}

main();