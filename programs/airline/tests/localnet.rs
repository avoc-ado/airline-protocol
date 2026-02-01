use solana_client::rpc_client::RpcClient;
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::pubkey::Pubkey;
use solana_sdk::signature::{Keypair, Signer};
use std::thread::sleep;
use std::time::Duration;

const DEFAULT_RPC_URL: &str = "http://127.0.0.1:8899";
const DEFAULT_PROGRAM_ID: &str = "C4AjCLzqwsL5cXoqiiazP8e7xo2ppNL3v2N9ju9wG4nK";

fn rpc_url() -> String {
    std::env::var("AIRLINE_RPC_URL").unwrap_or_else(|_| DEFAULT_RPC_URL.to_string())
}

fn program_id() -> Pubkey {
    let value = std::env::var("AIRLINE_PROGRAM_ID").unwrap_or_else(|_| DEFAULT_PROGRAM_ID.to_string());
    value.parse().expect("invalid AIRLINE_PROGRAM_ID")
}

#[test]
#[ignore]
fn localnet_airdrop_succeeds() {
    let client = RpcClient::new_with_commitment(rpc_url(), CommitmentConfig::confirmed());
    let keypair = Keypair::new();

    let signature = client
        .request_airdrop(&keypair.pubkey(), 1_000_000_000)
        .expect("airdrop request failed");

    client
        .confirm_transaction(&signature)
        .expect("airdrop confirmation failed");

    let mut balance = 0;
    for _ in 0..20 {
        balance = client
            .get_balance(&keypair.pubkey())
            .expect("balance fetch failed");

        if balance > 0 {
            break;
        }

        sleep(Duration::from_millis(250));
    }

    assert!(balance > 0, "expected balance after airdrop");
}

#[test]
#[ignore]
fn program_is_loaded_and_executable() {
    let client = RpcClient::new_with_commitment(rpc_url(), CommitmentConfig::confirmed());
    let program_key = program_id();

    let mut is_executable = false;
    for _ in 0..20 {
        if let Ok(account) = client.get_account(&program_key) {
            if account.executable {
                is_executable = true;
                break;
            }
        }

        sleep(Duration::from_millis(250));
    }

    assert!(is_executable, "expected program to be executable");
}
