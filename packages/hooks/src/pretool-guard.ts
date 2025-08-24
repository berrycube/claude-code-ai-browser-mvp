// Backward compatibility wrapper for pretool-guard
import { executePreToolGuard } from "./index.js";

async function main() {
  await executePreToolGuard();
}

main();