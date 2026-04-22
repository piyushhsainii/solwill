# SolWill

**Your crypto, protected forever.**

> Built for the [Solana Colosseum Frontier Hackathon](https://frontier.colosseum.org) — open track submission.

---

## What is SolWill?

SolWill is the first trustless crypto inheritance protocol on Solana. It lets you set up an on-chain will that automatically transfers your SOL, SPL tokens, and NFTs to your chosen heirs — without lawyers, custodians, intermediaries, or any human in the loop.

You check in regularly to prove you're alive. If you stop checking in, the smart contract triggers automatically and your heirs can claim their exact share. Everything is enforced by code, not by trust.

---

## The Problem

Over **$140 billion** in cryptocurrency is estimated to be permanently lost — not hacked, not stolen, just inaccessible after the owner dies or loses capacity. There is no recovery mechanism. No bank to call. No process to follow. The assets simply disappear.

Traditional crypto wallets have no concept of succession. You hold the keys, and when you can't, nobody can. Existing solutions require trusting a lawyer, a multisig committee, or a centralized service — all of which reintroduce the human failure points that crypto was designed to remove.

SolWill eliminates this entirely.

---

## How It Works

### For the will owner

1. **Connect your Solana wallet** — SolWill reads your assets automatically. No sign-up, no email, no password.
2. **Create your will** — Set a check-in interval (30, 90, or 180 days) and deploy your will on-chain. This initializes two PDAs: a `WillAccount` storing your configuration and a `VaultAccount` to hold your assets.
3. **Add heirs** — Enter each heir's wallet address and assign basis point splits. Up to 5 heirs. All heir data is stored in individual `HeirAccount` PDAs on-chain.
4. **Deposit assets** — Lock SOL, USDC, or any SPL token into the vault. The program controls the vault — not you, not anyone else.
5. **Check in** — Tap once every interval to reset the clock. Check-in can be done from any Solana wallet client.

### What happens if you stop checking in

Once the deadline passes, the will transitions to `Triggered` state. At that point, **anyone** can call the `trigger` instruction — the smart contract validates the on-chain clock and flips the state. No admin. No oracle. No trusted party.

### For heirs

1. Visit the SolWill app
2. Connect the wallet address registered as an heir
3. The program verifies the wallet, calculates their basis point share, and transfers assets in a single transaction

---

## On-Chain State Machine

```
Draft → Active → Active (checked in) → Triggered → Settled
```

Every state transition is enforced by the Anchor program. The `trigger` instruction contains a `require!` guard that checks:

```
clock.unix_timestamp > last_checkin + interval
```

It is mathematically impossible to trigger a will before its deadline without the Solana validator lying about the clock.

---

## Who It's For

- **Crypto holders** who want their assets to reach their family, not disappear
- **Long-term HODLers** with significant on-chain wealth and no succession plan
- **DAOs and multisig teams** who need a trustless fallback for inactive signers
- **Anyone** who has ever thought "what happens to my wallet if something happens to me"

You do not need to be technical to use SolWill. The check-in experience is a single tap.

---

## What Makes SolWill Different

### Fully trustless — the program is the law

There is no admin key. No multisig that can override the will. No Adevar Labs, no SolWill team, no anyone who can access your vault. The Anchor program is the only authority. Once deployed, the rules cannot be changed without a new transaction signed by the owner.

### Permissionless trigger

The `trigger` instruction has no privileged caller. Once the deadline passes, any wallet on earth can call it. This means the will executes even if the SolWill frontend goes offline, the team disappears, or the domain expires. The protocol is unstoppable.

### Multi-asset in a single transaction

SOL, SPL tokens, and NFTs (including compressed NFTs via Metaplex) are all locked in a single program-controlled vault and transferred atomically. Heirs do not need to claim each asset separately.

### Sub-cent check-ins

On Solana, a check-in transaction costs less than $0.001. This makes daily or weekly check-ins completely viable — something that would cost dollars in gas on Ethereum and therefore never happen in practice.

### Consumer-grade UX

SolWill is designed to look and feel like a product that could ship on the App Store. The check-in is a hold-to-confirm gesture. The dashboard shows a real-time countdown ring. The heir management page has live BPS validation and confirm dialogs. Complexity is hidden; the interface is calm and clear.

### No custodian, no KYC, no sign-up

SolWill never holds your keys. It never touches your assets outside of what the on-chain program enforces. There is no account to create, no email to verify, no terms of service that can change.

---

## Technology Stack

| Layer            | Technology                                     |
| ---------------- | ---------------------------------------------- |
| Smart contract   | Anchor (Rust) — 5 instructions, 3 PDAs         |
| Frontend         | Next.js 14 · TypeScript · App Router           |
| Animations       | Framer Motion                                  |
| State management | Zustand                                        |
| RPC & data       | Helius — enhanced tx parsing, webhooks         |
| NFT support      | Metaplex — standard + compressed NFTs          |
| Token transfers  | SPL Token program                              |
| Wallet support   | Phantom, Backpack, Solflare via Wallet Adapter |
| Network          | Solana (devnet → mainnet)                      |

---

## Program Architecture

### Accounts

**`WillAccount`** — PDA seeded by `["will", owner]`. Stores the owner pubkey, check-in interval, last check-in timestamp, heir count, total BPS allocated, asset list, and current status.

**`VaultAccount`** — PDA seeded by `["vault", willAccount]`. Program-owned. Holds all deposited SOL and SPL token balances. No external party can withdraw without a valid program instruction signed by the owner (or heirs, post-trigger).

**`HeirAccount`** — PDA seeded by `["heir", heirWalletAddress, willAccount]`. One per heir. Stores wallet address, basis point share, and claimed status. The `claimed` flag prevents double-claiming at the program level.

### Instructions

| Instruction                | Caller | Description                                        |
| -------------------------- | ------ | -------------------------------------------------- |
| `initialize`               | Owner  | Creates WillAccount and VaultAccount PDAs          |
| `deposit_sol`              | Owner  | Transfers SOL from owner wallet to vault           |
| `deposit_spl_tokens`       | Owner  | Transfers SPL tokens from owner ATA to vault ATA   |
| `add_heirs_to_will`        | Owner  | Creates a HeirAccount PDA for a given wallet + BPS |
| `update_heir_from_will`    | Owner  | Updates heir wallet address and/or BPS             |
| `remove_heir_from_will`    | Owner  | Closes HeirAccount PDA and reclaims rent           |
| `checkin_will`             | Owner  | Resets `last_checkin` to current clock timestamp   |
| `trigger` (permissionless) | Anyone | Flips will to Triggered state after deadline       |
| `claim_ll`                 | Heir   | Transfers heir's proportional share from vault     |
| `dissolve_will`            | Owner  | Cancels will and returns all vault assets to owner |

---

## Error Handling

The program defines 18 custom error codes covering every failure path — insufficient balance, BPS overflow, unauthorized callers, already-claimed wills, active will protection, invalid account relationships, and more. The frontend surfaces these with user-readable messages.

---

## Hackathon Context

SolWill was built for the **Solana Colosseum Frontier Hackathon** as an open-track submission under the Consumer Apps category.

It is also submitted to the **Adevar Labs security bounty track** — a $50,000 audit credit prize for projects that demonstrate strong security awareness. SolWill is a natural fit: it handles irreversible asset transfers with no recovery path, making a professional smart contract audit not optional but essential before mainnet launch.

The judging criteria for Frontier — technical execution, innovation, real-world use case, user experience, and completeness — directly shaped every design decision in SolWill. The permissionless trigger is the technical innovation. The $140B lost crypto problem is the real-world use case. The consumer-grade UI is the UX answer. The fully deployed devnet program with working end-to-end flow is the completeness proof.

---

## Security Considerations

SolWill handles irreversible, high-value transfers. Several attack surfaces were considered during design:

**Grief attacks** — an attacker cannot trigger a will early because the `require!` guard on `trigger` is validated entirely by `clock.unix_timestamp`, which is set by the Solana validator. The only way to bypass it is a validator-level attack, not an application-level one.

**Double-claim prevention** — the `claimed` flag on each `HeirAccount` is set atomically during the claim transaction. The program checks this flag before any transfer, making double-claiming impossible at the protocol level.

**BPS overflow** — the program tracks `total_bps` on the `WillAccount` and rejects any `add_heirs` instruction that would cause it to exceed 10,000. This is enforced on-chain, not just in the frontend.

**Unauthorized withdrawal** — the vault PDA is owned by the program. No instruction exists that allows direct withdrawal without owner authority (pre-trigger) or heir verification (post-trigger).

A professional audit of the program's authority checks, clock validation logic, and multi-asset transfer instructions is planned before mainnet launch.

---

## Project Status

- [x] Anchor program deployed on Solana devnet
- [x] Full end-to-end flow: create will → deposit → add heirs → check in → trigger → claim
- [x] Next.js frontend with Framer Motion animations
- [x] Zustand state management with on-chain sync hooks
- [x] Helius RPC integration for real-time data
- [ ] Mainnet deployment (post-audit)
- [ ] Compressed NFT (cNFT) claim support
- [ ] Mobile app (React Native)
- [ ] Email / push notifications via Helius webhooks

---

## Program ID

```
uJ5ujCBYYNJ7V4Fpurewj9cDSPT3jHnEKLnaxYPYss9
```

Network: Solana Devnet

---

## License

MIT — open source, forkable, auditable.

---

_SolWill — because your crypto should outlive you._
