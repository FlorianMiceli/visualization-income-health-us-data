import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const topoPath = join(root, "node_modules/us-atlas/counties-albers-10m.json");
process.stdout.write(readFileSync(topoPath, "utf8"));
