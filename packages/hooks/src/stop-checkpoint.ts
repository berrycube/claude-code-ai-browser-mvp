// Backward compatibility wrapper for stop-checkpoint
import { executeStopCheckpoint } from "./index.js";

async function main() {
  await executeStopCheckpoint();
}

main();