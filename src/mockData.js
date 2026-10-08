const DAY_LABELS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

function bucketLabels(range, customStart, customEnd) {
  if (range === "24h") return DAY_LABELS;
  if (range === "7d") return ["09/24", "09/25", "09/26", "09/27", "09/28", "09/29", "09/30"];
  if (range === "custom" && customStart && customEnd) {
    const start = new Date(customStart + "T00:00:00");
    const end = new Date(customEnd + "T00:00:00");
    const days = Math.max(1, Math.min(90, Math.round((end - start) / 86400000) + 1));
    if (days === 1) return DAY_LABELS;
    const count = Math.min(days, 12);
    return Array.from({ length: count }, (_, index) => {
      const dayOffset = Math.round((index / Math.max(count - 1, 1)) * (days - 1));
      const date = new Date(start.getTime() + dayOffset * 86400000);
      return (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
    });
  }
  return ["09/01", "09/04", "09/07", "09/10", "09/13", "09/16", "09/19", "09/22", "09/25", "09/28"];
}

export function createSeries(range, factor = 1, customStart, customEnd) {
  const labels = bucketLabels(range, customStart, customEnd);
  return labels.map((time, index) => {
    const wave = Math.sin((index / labels.length) * Math.PI * 2 - 1.35);
    const secondWave = Math.sin((index / labels.length) * Math.PI * 4 + 0.6);
    const daytime = Math.max(0, wave);
    const pulse = Math.max(0, secondWave);
    const sessions = Math.round((145 + daytime * 660 + pulse * 160 + (index % 3) * 16) * factor);
    const traces = Math.round(sessions * (2.3 + (index % 4) * 0.06));
    const dau = Math.round((92 + daytime * 360 + pulse * 72 + (index % 4) * 9) * factor);
    const input = Math.round((210 + daytime * 1150 + pulse * 330) * factor);
    const output = Math.round((148 + daytime * 790 + pulse * 205) * factor);
    const abnormal = Math.round((3 + daytime * 19 + pulse * 6 + (index % 5)) * factor);
    const totalTraces = Math.round(traces * (1.15 + (index % 3) * 0.04));
    const modelCalls = Math.round(traces * 1.72);
    const toolCalls = Math.round(traces * 0.74);
    return {
      time,
      sessions,
      traces,
      dau,
      input,
      output,
      totalTokens: input + output,
      endP50: 1.08 + daytime * 0.85 + pulse * 0.2,
      endP90: 2.9 + daytime * 2.5 + pulse * 0.9,
      endP99: 7.7 + daytime * 5.3 + pulse * 1.8,
      firstP50: 0.42 + daytime * 0.25 + pulse * 0.08,
      firstP90: 0.9 + daytime * 0.58 + pulse * 0.22,
      firstP99: 1.8 + daytime * 1.25 + pulse * 0.5,
      abnormal,
      totalTraces,
      abnormalRate: (abnormal / Math.max(totalTraces, 1)) * 100,
      modelErrors: Math.round(abnormal * 1.4),
      modelCalls,
      modelRate: (abnormal * 1.4 / Math.max(modelCalls, 1)) * 100,
      toolErrors: Math.round(abnormal * 0.65),
      toolCalls,
      toolRate: (abnormal * 0.65 / Math.max(toolCalls, 1)) * 100,
    };
  });
}

export const MODEL_TOKENS = [
  { name: "qwen3-max", input: 21.8, output: 13.6, calls: 42 },
  { name: "claude-sonnet-4", input: 16.4, output: 10.8, calls: 31 },
  { name: "deepseek-v3", input: 12.2, output: 8.4, calls: 26 },
  { name: "gpt-4.1", input: 9.8, output: 7.4, calls: 21 },
  { name: "qwen-plus", input: 8.1, output: 5.5, calls: 18 },
  { name: "gemini-2.5-pro", input: 5.9, output: 4.2, calls: 14 },
  { name: "glm-4.5", input: 4.4, output: 3.7, calls: 12 },
  { name: "qwen2.5-72b", input: 3.8, output: 3.2, calls: 9 },
  { name: "gpt-4.1-mini", input: 3.1, output: 2.4, calls: 8 },
  { name: "claude-haiku-3.5", input: 2.6, output: 1.7, calls: 7 },
  { name: "其他", input: 2.5, output: 1.9, calls: 6 },
].map((row) => ({ ...row, total: row.input + row.output }));

export const MODEL_LATENCY = [
  { name: "qwen3-max", calls: 188000, callAvg: 1.82, callP95: 4.6, callP99: 7.8, ttftP50: 0.44, ttftP90: 1.26, ttftP99: 3.1, outputTps: 36 },
  { name: "claude-sonnet-4", calls: 164000, callAvg: 2.28, callP95: 5.9, callP99: 9.4, ttftP50: 0.51, ttftP90: 1.48, ttftP99: 3.7, outputTps: 29 },
  { name: "deepseek-v3", calls: 149000, callAvg: 1.54, callP95: 3.8, callP99: 6.2, ttftP50: 0.38, ttftP90: 1.06, ttftP99: 2.8, outputTps: 42 },
  { name: "gpt-4.1", calls: 121000, callAvg: 2.45, callP95: 6.4, callP99: 10.2, ttftP50: 0.62, ttftP90: 1.72, ttftP99: 4.1, outputTps: 31 },
  { name: "qwen-plus", calls: 112000, callAvg: 1.24, callP95: 3.1, callP99: 5.2, ttftP50: 0.3, ttftP90: 0.88, ttftP99: 2.2, outputTps: 48 },
  { name: "gemini-2.5-pro", calls: 96000, callAvg: 2.14, callP95: 5.5, callP99: 8.8, ttftP50: 0.55, ttftP90: 1.58, ttftP99: 3.9, outputTps: 34 },
  { name: "glm-4.5", calls: 83000, callAvg: 1.38, callP95: 3.4, callP99: 5.6, ttftP50: 0.34, ttftP90: 0.98, ttftP99: 2.5, outputTps: 39 },
  { name: "qwen2.5-72b", calls: 76000, callAvg: 1.96, callP95: 5.1, callP99: 8.1, ttftP50: 0.48, ttftP90: 1.38, ttftP99: 3.4, outputTps: 32 },
  { name: "gpt-4.1-mini", calls: 61000, callAvg: 1.12, callP95: 2.8, callP99: 4.5, ttftP50: 0.26, ttftP90: 0.76, ttftP99: 1.9, outputTps: 51 },
  { name: "deepseek-r1", calls: 44000, callAvg: 3.1, callP95: 8.2, callP99: 13.6, ttftP50: 0.7, ttftP90: 2.02, ttftP99: 5.1, outputTps: 22 },
  { name: "其他", calls: 32000, callAvg: 1.48, callP95: 3.7, callP99: 6.1, ttftP50: 0.32, ttftP90: 0.92, ttftP99: 2.4, outputTps: 35 },
];

export const TOOL_CALLS = [
  { name: "web_search", value: 4860 },
  { name: "knowledge_retrieval", value: 3620 },
  { name: "sql_query", value: 2810 },
  { name: "code_run", value: 1960 },
  { name: "file_read", value: 1470 },
  { name: "workflow_trigger", value: 920 },
  { name: "table_query", value: 780 },
  { name: "document_lookup", value: 690 },
  { name: "risk_check", value: 570 },
  { name: "calendar_query", value: 420 },
  { name: "other", value: 310 },
];

export const MODEL_ERRORS = [
  { name: "qwen3-max", value: 34, rate: 1.2 },
  { name: "claude-sonnet-4", value: 28, rate: 0.9 },
  { name: "gpt-4.1", value: 21, rate: 1.5 },
  { name: "deepseek-v3", value: 19, rate: 0.8 },
  { name: "gemini-2.5-pro", value: 13, rate: 1.1 },
  { name: "qwen-plus", value: 11, rate: 0.5 },
  { name: "glm-4.5", value: 8, rate: 0.7 },
  { name: "qwen2.5-72b", value: 7, rate: 0.6 },
  { name: "gpt-4.1-mini", value: 6, rate: 0.7 },
  { name: "claude-haiku-3.5", value: 4, rate: 0.4 },
  { name: "其他", value: 3, rate: 0.5 },
];

export const TOOL_ERRORS = [
  { name: "web_search", value: 41, rate: 2.4 },
  { name: "knowledge_retrieval", value: 29, rate: 1.1 },
  { name: "sql_query", value: 21, rate: 1.8 },
  { name: "code_run", value: 14, rate: 1.4 },
  { name: "file_read", value: 9, rate: 0.9 },
  { name: "workflow_trigger", value: 7, rate: 1.1 },
  { name: "table_query", value: 6, rate: 1.2 },
  { name: "document_lookup", value: 4, rate: 0.8 },
  { name: "risk_check", value: 3, rate: 0.7 },
  { name: "other", value: 2, rate: 0.5 },
];
