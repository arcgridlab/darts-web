import { useMemo, useState } from "react";
import { saveHitRate } from "./hitRateApi";

const ROUNDS = 8;
const DARTS_PER_ROUND = 3;
const TARGETS = ["BULL", "20", "19", "18", "17", "16", "15"];

const today = () => new Date().toISOString().slice(0, 10);

export default function HitRatePage() {
  const [date, setDate] = useState(today());
  const [target, setTarget] = useState("BULL");
  // 各ラウンドの命中数(0〜3)。未入力は null
  const [hits, setHits] = useState<(number | null)[]>(
    Array(ROUNDS).fill(null)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const entered = hits.filter((h): h is number => h !== null);
    const hitCount = entered.reduce((a, b) => a + b, 0);
    const throws = entered.length * DARTS_PER_ROUND;
    const rate = throws ? (hitCount / throws) * 100 : 0;
    const hat = entered.filter((h) => h === DARTS_PER_ROUND).length;
    return { rounds: entered.length, hitCount, throws, rate, hat };
  }, [hits]);

  const finished = stats.rounds === ROUNDS;

  const setRound = (i: number, value: number) =>
    setHits((prev) => prev.map((h, idx) => (idx === i ? value : h)));

  const reset = () => {
    setHits(Array(ROUNDS).fill(null));
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await saveHitRate({
        date,
        target,
        rounds: ROUNDS,
        throws: stats.throws,
        hit_count: stats.hitCount,
        hit_rate: Math.round(stats.rate * 10) / 10,
        hat_count: stats.hat,
      });
      setMessage("保存しました");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h1>Hit率</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          {TARGETS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          padding: 12,
          marginBottom: 16,
          border: "1px solid #ccc",
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 700 }}>
          {stats.rate.toFixed(1)}%
        </div>
        <div>
          {stats.hitCount} / {stats.throws} 本 ・ ハット {stats.hat} 回 ・{" "}
          {stats.rounds} / {ROUNDS} R
        </div>
      </div>

      {hits.map((h, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ width: 36 }}>R{i + 1}</span>
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setRound(i, n)}
              style={{
                width: 48,
                height: 48,
                fontSize: 18,
                borderRadius: 8,
                border: "1px solid #888",
                background: h === n ? "#2563eb" : "transparent",
                color: h === n ? "#fff" : "inherit",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={reset}>リセット</button>
        <button onClick={handleSave} disabled={!finished || saving}>
          {saving ? "保存中..." : "結果を保存"}
        </button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}