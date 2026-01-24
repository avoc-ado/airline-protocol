# Jet V1 reference notes (GHesericsu/jet-v1)

Source repo cloned to: airline-protocol/vendor/jet-v1

## High-level layout
- Anchor program: `programs/jet` (Rust, Anchor)
- Typescript client library: `libraries/ts` (exported as `@jet-lab/jet-client`)
- Frontend app: `app` (Svelte + Rollup, SPA)
- Tests: `tests` (ts-mocha integration tests + test utilities)
- Scripts: `scripts` (localnet start, migrations, test runner)
- Rust CLI: `tools/cli`

## On-chain program (Anchor)
Program ID: `JPv1rCqrhagNNmJVM5J1he7msQ5ybtvE1nNuHpDHMNU`

Key instructions (see `programs/jet/src/lib.rs` and `programs/jet/src/instructions`):
- init_market, init_reserve, update_reserve_config
- init_deposit_account, init_collateral_account, init_loan_account, init_obligation
- set_market_owner, set_market_flags
- deposit, withdraw, deposit_collateral, withdraw_collateral
- borrow, repay, liquidate
- refresh_reserve
- default handler for dex liquidation

Key state accounts (see `programs/jet/src/state`):
- Market
- Reserve
- Obligation
- Cache

Program integrates with Pyth price oracles and Serum DEX (for liquidation routes).

## Localnet / validator setup
Anchor config (`Anchor.toml`) uses localnet and includes Serum DEX as a genesis program:
- Serum DEX program: `9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin`

Localnet script (`scripts/localnet-start.sh`):
- Starts `solana-test-validator` with Serum DEX program
- Runs `anchor build` and `anchor deploy`
- Runs `scripts/localnet-migrate.ts`

Migration (`scripts/localnet-migrate.ts`) does the following:
- Creates test mints (USDC, SOL, BTC, ETH)
- Creates Pyth product and price accounts, sets prices
- Creates Serum markets for SOL/USDC, BTC/USDC, ETH/USDC
- Initializes the Jet market and multiple reserves
- Writes IDL metadata (cluster, market, reserves) into `app/public/idl/localnet/jet.json`

## Typescript client library (libraries/ts)
Exports:
- `JetClient`, `JetMarket`, `JetReserve`, `JetUser`
- `Amount` helper (tokens, deposit notes, loan notes)
- Constants for DEX and program IDs

This library is used heavily in tests and is a good model for a shared client layer.

## Frontend app (app)
- Svelte SPA (Rollup build)
- Loads IDL from `app/public/idl/<cluster>/jet.json`
- Establishes direct RPC connection in the browser
- Uses Pyth price subscriptions
- Views: Cockpit, Settings, Transaction Logs
- Components include trading panels, reserve details, copilot guidance, wallet connection

## Integration tests
- `scripts/run-integ-tests.sh` runs ts-mocha against `tests/*.spec.ts`
- Tests use utilities in `tests/utils` for Pyth, Serum, and token setup
- Coverage includes deposit/withdraw, borrow/repay, collateral flows, and dex liquidation flows

## CLI (tools/cli)
Rust CLI provides read and maintenance commands:
- Read market, reserve, obligation
- Find a user obligation PDA
- Close deposit account

## Takeaways to mirror
- Anchor program + IDL-driven client workflows
- Localnet validator with Serum DEX program preloaded
- A migration step that produces IDL metadata for UI consumption
- Rich integration tests using program + localnet
- A shared client layer that both tests and clients can use
