//! Criterion benchmark for the matching engine's throughput.
//! Not wired into CI, not meant to be committed — throwaway harness.
//! Run: cargo bench --bench load_bench
//! Report: target/criterion/report/index.html

use criterion::{
    BatchSize, BenchmarkId, Criterion, Throughput, black_box, criterion_group, criterion_main,
};
use engine::engine::{Engine, Market, MarketId, NewOrderPayload};
use serde_json::json;

// ---------- helpers (same shape as tests/load_test.rs — pub(crate) fields
// mean this bench can only build orders through the public Deserialize impl,
// same door the real orders.in consumer walks through) ----------

fn order(json: serde_json::Value) -> NewOrderPayload {
    serde_json::from_value(json).expect("bad order fixture")
}

fn market(min_quantity: u64) -> Market {
    serde_json::from_value(json!({
        "tick_exp": 0,
        "lot_exp": 0,
        "min_quantity": min_quantity
    }))
    .unwrap()
}

fn engine_with_market(market_id: &str, min_quantity: u64) -> Engine {
    let mut engine = Engine::default();
    engine.add_market(MarketId::from(market_id), market(min_quantity));
    engine
}

fn limit(id: &str, user: &str, mkt: &str, side: &str, price: u64, qty: u64) -> NewOrderPayload {
    order(json!({
        "client_order_id": id,
        "user_id": user,
        "market_id": mkt,
        "side": side,
        "order_kind": "LimitGtc",
        "price": price,
        "quantity": qty
    }))
}

fn market_order(id: &str, user: &str, mkt: &str, side: &str, qty: u64) -> NewOrderPayload {
    order(json!({
        "client_order_id": id,
        "user_id": user,
        "market_id": mkt,
        "side": side,
        "order_kind": "Market",
        "price": null,
        "quantity": qty
    }))
}

struct Rng(u64);
impl Rng {
    fn next_u64(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }
    fn range(&mut self, lo: u64, hi: u64) -> u64 {
        lo + self.next_u64() % (hi - lo)
    }
}

const MKT: &str = "SOL-USDC";
const MID_PRICE: u64 = 10_000;
const USER_POOL: usize = 200;

/// 60% LimitGtc (mixed resting/crossing), 40% Market — matches the criteria
/// test's mix so bench numbers and correctness tests describe the same load.
fn mixed_workload(n: usize, seed: u64) -> Vec<NewOrderPayload> {
    let mut rng = Rng(seed);
    let mut out = Vec::with_capacity(n);

    for i in 0..n {
        let user = format!("user-{}", rng.range(0, USER_POOL as u64));
        let id = format!("cid-{}", i);
        let side = if rng.next_u64() % 2 == 0 {
            "BID"
        } else {
            "ASK"
        };

        if rng.next_u64() % 10 < 6 {
            let offset = rng.range(0, 200) as i64 - 100;
            let price = (MID_PRICE as i64 + offset).max(1) as u64;
            let qty = rng.range(1, 50);
            out.push(limit(&id, &user, MKT, side, price, qty));
        } else {
            let qty = rng.range(1, 30);
            out.push(market_order(&id, &user, MKT, side, qty));
        }
    }
    out
}

fn seed_liquidity(engine: &mut Engine, levels: u64) {
    for i in 0..levels {
        let bid = limit(
            &format!("seed-bid-{i}"),
            "seed-maker",
            MKT,
            "BID",
            MID_PRICE - 1 - i,
            100,
        );
        let ask = limit(
            &format!("seed-ask-{i}"),
            "seed-maker",
            MKT,
            "ASK",
            MID_PRICE + 1 + i,
            100,
        );
        engine.submit_new_order(&bid).unwrap();
        engine.submit_new_order(&ask).unwrap();
    }
}

fn bench_mixed_workload(c: &mut Criterion) {
    let mut group = c.benchmark_group("mixed_workload");

    for &n in &[1_000usize, 100_000usize] {
        group.throughput(Throughput::Elements(n as u64));
        group.bench_with_input(BenchmarkId::from_parameter(n), &n, |b, &n| {
            b.iter_batched(
                || {
                    let mut engine = engine_with_market(MKT, 1);
                    seed_liquidity(&mut engine, 200);
                    let orders = mixed_workload(n, 0xC0FFEE ^ n as u64);
                    (engine, orders)
                },
                |(mut engine, orders)| {
                    for o in &orders {
                        black_box(engine.submit_new_order(o).ok());
                    }
                },
                BatchSize::LargeInput,
            );
        });
    }

    group.finish();
}

criterion_group!(benches, bench_mixed_workload);
criterion_main!(benches);
