# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable prototype requirements

- This dashboard is a front-end-only prototype using mock data; do not add a real business backend.
- The application filter has exactly “全部应用” and “QwenPaw”; the task-scene filter has exactly “全部场景”, “对话服务”, and “自动化任务”.
- Keep “会话追踪” visible in the sidebar but disabled; the tracking page is out of scope for this phase.
- Use `#355eb8` with neutral white and gray for controls and navigation. Preserve the current metric-card and chart palettes.
- Do not copy the WorkBuddy reference’s cost page or department-level constructs; the PRD intentionally changes those areas.

## Current design decisions

- The performance view compares model performance with one line per selected model. Its metric selector includes model-call average/P95/P99 latency, first-token P50/P90/P99 latency, and output TPS; tooltips show the metric value and sample count.
- Keep total, input, and output Token usage visible without cache-token metrics. Keep Token usage and performance metrics separate; do not add cost or credit metrics to the performance view.
- The prototype uses mock data only.
