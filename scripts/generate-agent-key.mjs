#!/usr/bin/env node
import bs58 from "bs58";
import nacl from "tweetnacl";

const keyPair = nacl.sign.keyPair();
const publicKey = bs58.encode(keyPair.publicKey);
const privateKey = bs58.encode(keyPair.secretKey);
const agentId = process.argv[2] ?? "agent-research";
const name = process.argv[3] ?? "Demo Agent";
const description =
  process.argv[4] ?? "Solana demo agent that requests wallet-safe actions.";

const pairing = new URL("skillguard://pair");
pairing.searchParams.set("agentId", agentId);
pairing.searchParams.set("name", name);
pairing.searchParams.set("description", description);
pairing.searchParams.set("protocols", "helius,birdeye");
pairing.searchParams.set("publicKey", publicKey);

console.log(`SKILLGUARD_AGENT_PUBLIC_KEY=${publicKey}`);
console.log(`SKILLGUARD_AGENT_PRIVATE_KEY_B58=${privateKey}`);
console.log("");
console.log(pairing.toString());
