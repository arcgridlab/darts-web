export type HitRatePayload = {
  date: string;
  target: string;
  rounds: number;
  throws: number;
  hit_count: number;
  hit_rate: number;
  hat_count: number;
};

const API_URL = import.meta.env.VITE_API_URL;

export async function saveHitRate(payload: HitRatePayload) {
  const res = await fetch(`${API_URL}/api/darts-hit-rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // TODO: Supabaseのアクセストークンを付ける
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("保存に失敗しました");
  return res.json();
}