import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = "C:\\Users\\1136962520\\OneDrive\\Desktop\\MiTanda\\mitanda-contracts\\out";
const ABIS_DIR = join(__dirname, "..", "lib", "contracts", "abis");
mkdirSync(ABIS_DIR, { recursive: true });

const targets = [
  { src: "TandaManager.sol/TandaManager.json", file: "Manager.ts", name: "ManagerAbi" },
  { src: "Tanda.sol/Tanda.json", file: "Tanda.ts", name: "TandaAbi" },
  { src: "MitandaPassNFT.sol/MitandaPassNFT.json", file: "MitandaPassNFT.ts", name: "MitandaPassNFTAbi" },
  { src: "MitandaReceiptNFT.sol/MitandaReceiptNFT.json", file: "MitandaReceiptNFT.ts", name: "MitandaReceiptNFTAbi" },
  { src: "MitandaCompletionNFT.sol/MitandaCompletionNFT.json", file: "MitandaCompletionNFT.ts", name: "MitandaCompletionNFTAbi" },
];

for (const t of targets) {
  const artifact = JSON.parse(readFileSync(join(OUT, t.src.replaceAll("/", "\\")), "utf8"));
  const abi = artifact.abi;
  if (!Array.isArray(abi)) throw new Error(`No abi array in ${t.src}`);
  const body = `// Auto-generated from mitanda-contracts/out/${t.src}\n// Do not edit by hand; re-run scripts/gen-abis.mjs to refresh.\nexport const ${t.name} = ${JSON.stringify(abi, null, 2)} as const;\n`;
  writeFileSync(join(ABIS_DIR, t.file), body);
  console.log(`wrote ${t.file} (${abi.length} entries)`);
}

// Standard minimal ERC-20 ABI for USDC interactions (read balance/allowance/decimals, approve).
const erc20 = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "transferFrom", stateMutability: "nonpayable", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "event", name: "Transfer", inputs: [{ name: "from", type: "address", indexed: true }, { name: "to", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }], anonymous: false },
  { type: "event", name: "Approval", inputs: [{ name: "owner", type: "address", indexed: true }, { name: "spender", type: "address", indexed: true }, { name: "value", type: "uint256", indexed: false }], anonymous: false },
];
writeFileSync(
  join(ABIS_DIR, "IERC20.ts"),
  `// Standard minimal ERC-20 ABI (USDC interactions: balance, allowance, decimals, approve).\nexport const IERC20Abi = ${JSON.stringify(erc20, null, 2)} as const;\n`
);
console.log("wrote IERC20.ts (standard)");

// Barrel re-export.
const index = [
  `export { ManagerAbi } from "./Manager";`,
  `export { TandaAbi } from "./Tanda";`,
  `export { MitandaPassNFTAbi } from "./MitandaPassNFT";`,
  `export { MitandaReceiptNFTAbi } from "./MitandaReceiptNFT";`,
  `export { MitandaCompletionNFTAbi } from "./MitandaCompletionNFT";`,
  `export { IERC20Abi } from "./IERC20";`,
  "",
].join("\n");
writeFileSync(join(ABIS_DIR, "index.ts"), index);
console.log("wrote index.ts");
