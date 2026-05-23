use crate::types::{MarketId, MarketState};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs::File, io::Write};
use tokio::task::JoinHandle;

#[derive(Serialize, Deserialize)]
pub struct MarketSnapshot {
    pub(crate) market_state: MarketState,
    pub(crate) partition: i32,
}

pub struct SnapshotWriter {
    markets: HashMap<MarketId, JoinHandle<()>>,
}

impl SnapshotWriter {
    pub fn new() -> anyhow::Result<Self> {
        std::fs::create_dir_all("snapshots")?;
        Ok(Self {
            markets: HashMap::new(),
        })
    }

    pub fn take_snapshot(
        &mut self,
        market_id: &MarketId,
        state: &MarketState,
        partition: i32,
    ) -> anyhow::Result<()> {
        if let Some(task) = self.markets.get(market_id)
            && !task.is_finished()
        {
            eprintln!(
                "snapshot task for market_id: {} is still running",
                market_id
            );
            return Ok(());
        }

        let snapshot = MarketSnapshot {
            market_state: state.clone(),
            partition,
        };

        let market_id = market_id.clone();
        let market_id_owned = market_id.clone();

        let handle = tokio::task::spawn_blocking(move || {
            let result: anyhow::Result<()> = (|| {
                let bytes = bincode::serialize(&snapshot)?;
                let final_path = format!("snapshots/{market_id_owned}.bin");
                let temp_path = format!("snapshots/{market_id_owned}.bin.temp");

                let mut file = File::create(&temp_path)?;
                file.write_all(&bytes)?;
                file.sync_all()?;
                std::fs::rename(&temp_path, &final_path)?;
                Ok(())
            })();

            if let Err(e) = result {
                eprintln!("snapshot failed for market_id: {market_id_owned} with error: {e}")
            }
        });

        self.markets.insert(market_id, handle);

        Ok(())
    }

    pub fn load_all() -> anyhow::Result<Vec<(MarketId, MarketSnapshot)>> {
        let mut out = Vec::new();

        let dir = match std::fs::read_dir("snapshots") {
            Ok(d) => d,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(out),
            Err(e) => return Err(e.into()),
        };

        for entry in dir {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) != Some("bin") {
                continue;
            }

            let marked_id: MarketId = path
                .file_stem()
                .and_then(|s| s.to_str())
                .ok_or_else(|| anyhow::anyhow!("bad filename: {:?}", path))?
                .into();

            let bytes = std::fs::read(&path)?;
            let snapshot = bincode::deserialize(&bytes)?;

            out.push((marked_id, snapshot));
        }
        Ok(out)
    }
}
