use crate::engine::{MarketId, MarketState};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    env,
    fs::File,
    io::Write,
    path::{Path, PathBuf},
};
use tokio::task::JoinHandle;

const DEFAULT_SNAPSHOT_DIR: &str = "snapshots";

/**
 * A relative default resolves against the launch directory, so a run from the
 * repo root and one from apps/engine would keep separate books.
 */
pub fn snapshot_dir() -> PathBuf {
    env::var("SNAPSHOT_DIR")
        .unwrap_or_else(|_| DEFAULT_SNAPSHOT_DIR.into())
        .into()
}

#[derive(Serialize, Deserialize)]
pub struct MarketSnapshot {
    pub(crate) market_state: MarketState,
    pub(crate) partition: i32,
}

pub struct SnapshotWriter {
    dir: PathBuf,
    markets: HashMap<MarketId, JoinHandle<()>>,
}

impl SnapshotWriter {
    pub fn new() -> anyhow::Result<Self> {
        let dir = snapshot_dir();
        std::fs::create_dir_all(&dir)?;
        Ok(Self {
            dir,
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
        let dir = self.dir.clone();

        let handle = tokio::task::spawn_blocking(move || {
            if let Err(e) = write_snapshot(&dir, &market_id_owned, &snapshot) {
                eprintln!("snapshot failed for market_id: {market_id_owned} with error: {e}")
            }
        });

        self.markets.insert(market_id, handle);

        Ok(())
    }

    /**
     * Shutdown path: writes inline rather than spawning, so the book is on disk
     * before the process exits.
     */
    pub fn take_snapshot_now(
        &mut self,
        market_id: &MarketId,
        state: &MarketState,
        partition: i32,
    ) -> anyhow::Result<()> {
        let snapshot = MarketSnapshot {
            market_state: state.clone(),
            partition,
        };

        write_snapshot(&self.dir, market_id, &snapshot)
    }

    /** An in-flight background write would otherwise be dropped mid-file. */
    pub async fn flush(&mut self) {
        for (market_id, handle) in self.markets.drain() {
            if let Err(e) = handle.await {
                eprintln!("snapshot task for market_id: {market_id} failed to join: {e}")
            }
        }
    }

    pub fn load_all() -> anyhow::Result<Vec<(MarketId, MarketSnapshot)>> {
        let mut out = Vec::new();

        let dir = match std::fs::read_dir(snapshot_dir()) {
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

            let market_id: MarketId = path
                .file_stem()
                .and_then(|s| s.to_str())
                .ok_or_else(|| anyhow::anyhow!("bad filename: {:?}", path))?
                .into();

            let bytes = std::fs::read(&path)?;
            let snapshot = bincode::deserialize(&bytes)?;

            out.push((market_id, snapshot));
        }
        Ok(out)
    }
}

/** Written to a temp file and renamed, so a crash cannot leave a partial book. */
fn write_snapshot(
    dir: &Path,
    market_id: &MarketId,
    snapshot: &MarketSnapshot,
) -> anyhow::Result<()> {
    let bytes = bincode::serialize(snapshot)?;
    let final_path = dir.join(format!("{market_id}.bin"));
    let temp_path = dir.join(format!("{market_id}.bin.temp"));

    let mut file = File::create(&temp_path)?;
    file.write_all(&bytes)?;
    file.sync_all()?;
    std::fs::rename(&temp_path, &final_path)?;
    Ok(())
}
