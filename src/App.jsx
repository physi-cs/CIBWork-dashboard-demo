import { useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Buildings,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChartLineUp,
  Check,
  CheckCircle,
  Clock,
  Cube,
  DownloadSimple,
  Eye,
  Gauge,
  GearSix,
  Pulse,
  Robot,
  SquaresFour,
  Stack,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LabelList,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MODEL_ERRORS,
  MODEL_LATENCY,
  MODEL_TOKENS,
  USER_TOKENS,
  TOOL_CALLS,
  TOOL_ERRORS,
  createSeries,
} from "./mockData";

const GREEN = "#079878";
const TEAL = "#22b8a5";
const BLUE = "#188fbe";
const VIOLET = "#8260e8";
const AMBER = "#d29a2d";
const RED = "#e35b58";
const MUTED = "#98a4ae";
const CHART_COLORS = [GREEN, BLUE, TEAL, VIOLET, AMBER, "#58b6de", "#df7ab0", "#97a2b4"];

const VIEW_LABELS = {
  traffic: "用户流量",
  tokens: "Token 用量",
  performance: "性能耗时",
  quality: "质量状态",
};

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #e4e9e8",
    borderRadius: 10,
    boxShadow: "0 10px 28px rgba(28, 58, 51, .10)",
    fontSize: 12,
  },
  labelStyle: { color: "#52615d", fontWeight: 650, marginBottom: 6 },
  itemStyle: { color: "#4b5d58", paddingBlock: 2 },
  cursor: { stroke: "#aab9b4", strokeDasharray: "3 4" },
};

const MODEL_PERFORMANCE_METRICS = [
  { value: "callAvg", label: "调用耗时均值", unit: "s" },
  { value: "callP95", label: "调用耗时 P95", unit: "s" },
  { value: "callP99", label: "调用耗时 P99", unit: "s" },
  { value: "ttftP50", label: "首 Token P50", unit: "s" },
  { value: "ttftP90", label: "首 Token P90", unit: "s" },
  { value: "ttftP99", label: "首 Token P99", unit: "s" },
  { value: "outputTps", label: "输出 TPS", unit: "Token/s" },
];

function formatCompact(value, unit = "") {
  if (value >= 100000000) return (value / 100000000).toFixed(2).replace(/\.00$/, "") + "亿" + unit;
  if (value >= 10000) return (value / 10000).toFixed(1).replace(/\.0$/, "") + "万" + unit;
  return Math.round(value).toLocaleString("zh-CN") + unit;
}

function rangeMultiplier(range, customStart, customEnd) {
  if (range === "7d") return 4.6;
  if (range === "30d") return 18.7;
  if (range === "custom" && customStart && customEnd) {
    return Math.max(1, Math.min(90, Math.round((new Date(customEnd) - new Date(customStart)) / 86400000) + 1));
  }
  return 1;
}

function SelectControl({ label, value, options, onChange, disabled = false }) {
  return (
    <label className={"filter-control" + (disabled ? " is-disabled" : "")}>
      <span>{label}</span>
      <select value={value} onChange={onChange} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <CaretDown size={13} weight="bold" />
    </label>
  );
}

function Trend({ value, down = false }) {
  return (
    <div className={"trend " + (down ? "trend-down" : "trend-up")}>
      {down ? <ArrowDownRight size={14} weight="bold" /> : <ArrowUpRight size={14} weight="bold" />}
      <span>{value}</span>
      <span className="trend-caption">环比</span>
    </div>
  );
}

function MetricCard({ label, value, unit, trend, tone = "green", icon: Icon, detail, onClick, down }) {
  return (
    <button className={"metric-card metric-" + tone + (onClick ? " metric-clickable" : "")} onClick={onClick}>
      <span className="metric-accent" />
      <div className="metric-heading">
        <span>{label}</span>
        {Icon && <span className="metric-icon"><Icon size={16} weight="regular" /></span>}
      </div>
      <div className="metric-value">{value}<span className="metric-unit">{unit}</span></div>
      <div className="metric-footer">
        {trend ? <Trend value={trend} down={down} /> : <span className="metric-detail">{detail}</span>}
        {onClick && <ArrowRight className="metric-arrow" size={15} />}
      </div>
    </button>
  );
}

function MetricInlineCard({ label, main, values, color = "green", note }) {
  return (
    <div className={"metric-inline metric-inline-" + color}>
      <div className="metric-inline-top"><span>{label}</span><span className="metric-inline-note">{note}</span></div>
      <div className="metric-inline-main">{main}</div>
      <div className="percentile-row">
        {values.map((item) => <div key={item.label}><span>{item.label}</span><b>{item.value}</b></div>)}
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className = "", onClickTitle }) {
  return (
    <section className={"panel " + className}>
      <div className="panel-header">
        <div>
          <button className={"panel-title" + (onClickTitle ? " panel-title-link" : "")} onClick={onClickTitle}>{title}</button>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="panel-action">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function ToggleLegend({ items, hidden, onToggle }) {
  return (
    <div className="legend-row">
      {items.map((item) => (
        <button
          className={"legend-item" + (hidden[item.key] ? " legend-muted" : "")}
          key={item.key}
          onClick={() => onToggle(item.key)}
        >
          <span className="legend-dot" style={{ backgroundColor: item.color }} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function EmptyChart({ children, className = "" }) {
  return (
    <div className={"chart-frame " + className}>
      {children}
    </div>
  );
}

export function App() {
  const [view, setView] = useState("traffic");
  const [range, setRange] = useState("24h");
  const [customStart, setCustomStart] = useState("2026-09-29");
  const [customEnd, setCustomEnd] = useState("2026-09-30");
  const [appFilter, setAppFilter] = useState("all");
  const [sceneFilter, setSceneFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("10:42:36");
  const [hiddenSeries, setHiddenSeries] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(() => {
      const now = new Date();
      setUpdatedAt(now.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 60000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  const appOptions = [
    { value: "all", label: "全部应用" },
    { value: "qwenpaw", label: "QwenPaw" },
  ];
  const appFactors = { all: 1, qwenpaw: 1 };
  const factor = appFactors[appFilter] * (sceneFilter === "all" ? 1 : sceneFilter === "conversation" ? 0.62 : 0.38);
  const series = useMemo(() => createSeries(range, factor, customStart, customEnd), [range, factor, customStart, customEnd]);
  const multiplier = rangeMultiplier(range, customStart, customEnd);
  const tokenTotal = Math.round(842000000 * factor * multiplier);
  const inputTokens = Math.round(tokenTotal * 0.724);
  const outputTokens = tokenTotal - inputTokens;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const openDrill = () => showToast("会话追踪本期暂未开放");

  const toggleSeries = (key) => {
    setHiddenSeries((current) => ({ ...current, [key]: !current[key] }));
  };

  const setFilter = (setter, value) => {
    setter(value);
  };

  const exportData = () => {
    const headers = ["时间", "会话数", "Trace数", "DAU", "输入Token", "输出Token", "对话异常数"];
    const rows = series.map((row) => [row.time, row.sessions, row.traces, row.dau, row.input, row.output, row.abnormal]);
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "CIBWork-" + (VIEW_LABELS[view] || "监控数据") + ".csv";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("Mock 数据已导出，可用 Excel 打开");
  };

  const refresh = () => {
    const now = new Date();
    setUpdatedAt(now.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    showToast("数据已刷新");
  };

  const goView = (nextView) => {
    setView(nextView);
  };

  const title = "实时监控";
  const subtitle = "查看 AI 应用的使用规模、性能体验与运行质量";

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => goView("traffic")} aria-label="CIBWork 运营看板首页">
          <span className="brand-mark"><ChartLineUp size={21} weight="bold" /></span>
          <span className="brand-name"><b>CIBWork</b><small>运营看板</small></span>
          <span className="brand-divider" />
          <span className="brand-console">企业控制台</span>
        </button>
        <div className="topbar-right">
          <button className="top-link" onClick={() => showToast("订单管理为演示导航")}>订单管理</button>
          <button className="top-link" onClick={() => showToast("帮助文档为演示导航")}>帮助文档</button>
          <button className="notification-button" onClick={() => showToast("当前没有新的系统通知")} aria-label="通知">
            <Bell size={18} />
            <span />
          </button>
          <div className="profile">
            <div className="profile-avatar">林</div>
            <div><b>运营管理员</b><small>企业管理员</small></div>
            <CaretDown size={13} />
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="workspace-switcher">
          <span className="workspace-avatar">C</span>
          <div><b>兴业银行</b><small>Enterprise</small></div>
          <CaretDown size={13} />
        </div>
        <div className="side-scroll">
          <div className="nav-label">工作空间</div>
          <button className="nav-item" onClick={() => showToast("组织概览为演示导航")}><SquaresFour size={18} /><span>组织概览</span></button>
          <button className="nav-item" onClick={() => showToast("智能体管理为演示导航")}><Robot size={18} /><span>智能体管理</span><CaretRight className="nav-caret" size={13} /></button>
          <button className="nav-item" onClick={() => showToast("AI 资源管理为演示导航")}><Cube size={18} /><span>AI 资源管理</span><CaretRight className="nav-caret" size={13} /></button>
          <div className="nav-section">
            <div className="nav-section-title"><Pulse size={18} /><span>可观测中心</span><CaretDown size={13} /></div>
            <button className="nav-subitem active" onClick={() => goView("traffic")}>
              <span className="nav-dot" />实时监控
            </button>
            <button className="nav-subitem nav-subitem-disabled" disabled title="本期暂未开放" aria-disabled="true">
              <span className="nav-dot" />会话追踪
            </button>
          </div>
          <button className="nav-item" onClick={() => showToast("客户端配置为演示导航")}><Eye size={18} /><span>客户端配置</span><CaretRight className="nav-caret" size={13} /></button>
          <button className="nav-item" onClick={() => showToast("安全中心为演示导航")}><WarningCircle size={18} /><span>安全中心</span><CaretRight className="nav-caret" size={13} /></button>
          <button className="nav-item" onClick={() => showToast("数据统计为演示导航")}><ChartLineUp size={18} /><span>数据统计</span><CaretRight className="nav-caret" size={13} /></button>
          <button className="nav-item" onClick={() => showToast("组织与成员为演示导航")}><UsersThree size={18} /><span>组织与成员</span><CaretRight className="nav-caret" size={13} /></button>
          <div className="sidebar-separator" />
          <div className="nav-label">平台设置</div>
          <button className="nav-item" onClick={() => showToast("企业设置为演示导航")}><GearSix size={18} /><span>企业设置</span><CaretRight className="nav-caret" size={13} /></button>
          <button className="nav-item" onClick={() => showToast("应用与集成为演示导航")}><Stack size={18} /><span>应用与集成</span><CaretRight className="nav-caret" size={13} /></button>
        </div>
        <div className="sidebar-bottom">
          <div className="status-card"><span className="online-dot" /><div><b>服务运行正常</b><small>数据采集延迟 2 分钟</small></div></div>
          <button className="help-button" onClick={() => showToast("可观测中心帮助文档")}><Buildings size={16} />查看帮助中心<ArrowRight size={14} /></button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-heading">
          <div>
            <div className="breadcrumb"><span>可观测中心</span><CaretRight size={12} /><span className="breadcrumb-current">{title}</span></div>
            <div className="title-row">
              <h1>{title}</h1>
              <span className="live-pill"><span className="live-dot" />实时数据</span>
            </div>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="update-status">
            <span className="update-dot" />
            <span>更新于 <b>{updatedAt}</b></span>
            <span className="update-divider" />
            <span>采集延迟 <b>2 分钟</b></span>
          </div>
        </div>

        <section className="filter-bar">
          <div className="filter-left">
            <SelectControl
              label="应用名称"
              value={appFilter}
              onChange={(event) => setFilter(setAppFilter, event.target.value)}
              options={appOptions}
            />
            <SelectControl
              label="任务场景"
              value={sceneFilter}
              onChange={(event) => setFilter(setSceneFilter, event.target.value)}
              options={[
                { value: "all", label: "全部场景" },
                { value: "conversation", label: "对话服务" },
                { value: "automation", label: "自动化任务" },
              ]}
            />
            <SelectControl
              label="组织范围"
              value="all"
              disabled
              options={[{ value: "all", label: "全行" }]}
            />
            <SelectControl
              label="时间范围"
              value={range}
              onChange={(event) => setFilter(setRange, event.target.value)}
              options={[
                { value: "24h", label: "最近 24 小时" },
                { value: "7d", label: "最近 7 天" },
                { value: "30d", label: "最近 30 天" },
                { value: "custom", label: "自定义日期" },
              ]}
            />
            {range === "custom" && (
              <div className="custom-date-range">
                <label><span>起</span><input type="date" value={customStart} onChange={(event) => { const next = event.target.value; setCustomStart(next); if (next > customEnd) setCustomEnd(next); }} /></label>
                <span className="date-separator">至</span>
                <label><span>止</span><input type="date" value={customEnd} min={customStart} onChange={(event) => setCustomEnd(event.target.value)} /></label>
              </div>
            )}
          </div>
          <div className="filter-right">
            <label className="refresh-toggle">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              <span className="check-box"><Check size={11} weight="bold" /></span>
              自动刷新
            </label>
            <button className="icon-button refresh-button" onClick={refresh} aria-label="刷新数据"><ArrowClockwise size={15} /></button>
            <button className="button button-primary button-export" onClick={exportData}><DownloadSimple size={16} />导出数据</button>
          </div>
        </section>

        <>
            <div className="view-tabs">
              {[
                ["traffic", "用户流量", SquaresFour, "green"],
                ["tokens", "Token 用量", Stack, "blue"],
                ["performance", "性能耗时", Gauge, "teal"],
                ["quality", "质量状态", WarningCircle, "amber"],
              ].map(([key, label, Icon, color]) => (
                <button className={"view-tab tab-" + color + (view === key ? " active" : "")} key={key} onClick={() => goView(key)}>
                  <Icon size={16} weight={view === key ? "fill" : "regular"} />
                  {label}
                </button>
              ))}
              <div className="tab-spacer" />
              <span className="tab-context"><CalendarBlank size={14} />{range === "24h" ? "按小时" : range === "7d" ? "按天" : "按日期"}聚合</span>
            </div>
            {view === "traffic" && (
              <TrafficView
                series={series}
                factor={factor}
                multiplier={multiplier}
                hidden={hiddenSeries}
                onToggle={toggleSeries}
                onDrill={openDrill}
              />
            )}
            {view === "tokens" && (
              <TokensView
                series={series}
                tokenTotal={tokenTotal}
                inputTokens={inputTokens}
                outputTokens={outputTokens}
                hidden={hiddenSeries}
                onToggle={toggleSeries}
                onDrill={openDrill}
              />
            )}
            {view === "performance" && (
              <PerformanceView
                series={series}
                hidden={hiddenSeries}
                onToggle={toggleSeries}
                onDrill={openDrill}
              />
            )}
            {view === "quality" && (
              <QualityView
                series={series}
                hidden={hiddenSeries}
                onToggle={toggleSeries}
                onDrill={openDrill}
              />
            )}
          </>

        <footer className="page-footer">
          <span><span className="mock-indicator" />演示环境 · 当前数据为前端 mock 数据</span>
          <span>默认留存 90 天 <span className="footer-separator">·</span> 仅管理员可查看</span>
        </footer>
      </main>

      {toast && <div className="toast"><CheckCircle size={17} />{toast}</div>}
    </div>
  );
}

function TrafficView({ series, factor, multiplier, hidden, onToggle, onDrill }) {
  const sessionCount = Math.round(263482 * factor * multiplier);
  const activeUsers = Math.round(14268 * factor * Math.sqrt(multiplier));
  const totalTokens = Math.round(842000000 * factor * multiplier);
  const last = series[series.length - 1] || {};
  return (
    <div className="view-content">
      <div className="metrics-grid metrics-six">
        <MetricCard label="会话数" value={formatCompact(sessionCount)} trend="8.6%" icon={SquaresFour} tone="green" onClick={() => onDrill("会话数", null)} />
        <MetricCard label="活跃用户 DAU" value={activeUsers.toLocaleString("zh-CN")} unit="人" trend="3.2%" icon={UsersThree} tone="green" onClick={() => onDrill("活跃用户", null)} />
        <MetricCard label="总 Token 用量" value={formatCompact(totalTokens)} trend="12.4%" icon={Stack} tone="blue" onClick={() => onDrill("Token 用量", null)} />
        <MetricCard label="首 Token 耗时" value="0.82 / 2.35 / 6.80" unit="s" detail="P50 / P90 / P99" icon={Clock} tone="teal" onClick={() => onDrill("首 Token 耗时", null)} />
        <MetricCard label="端到端对话耗时" value="12.8 / 38.5 / 128" unit="s" detail="P50 / P90 / P99" icon={Gauge} tone="teal" onClick={() => onDrill("对话耗时", null)} />
        <MetricCard label="对话异常率" value={(2.7 + (last.abnormalRate || 0) / 12).toFixed(1)} unit="%" trend="0.4%" down tone="red" icon={WarningCircle} onClick={() => onDrill("异常 Trace", null)} />
      </div>
      <div className="section-heading">
        <div><span className="section-bar" /><h2>使用规模</h2><span className="section-caption">当前统计范围：全行</span></div>
      </div>
      <div className="chart-grid">
        <Panel
          title="会话量趋势"
          subtitle="Session · 按时间桶统计去重任务会话"
          action={<span className="chart-unit">个</span>}
        >
          <EmptyChart>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 12, right: 14, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("Session · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={45} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toLocaleString("zh-CN"), "会话数"]} />
                <Line hide={hidden.sessionCount} type="monotone" dataKey="sessions" stroke={GREEN} strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend items={[{ key: "sessionCount", label: "会话数", color: GREEN }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
        <Panel
          title="对话量趋势"
          subtitle="Trace · 按时间桶统计单轮对话"
          action={<span className="chart-unit">条</span>}
        >
          <EmptyChart>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 12, right: 14, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("Trace · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={45} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toLocaleString("zh-CN"), "Trace 数"]} />
                <Area hide={hidden.traceCount} type="monotone" dataKey="traces" stroke={BLUE} strokeWidth={2.5} fill={BLUE} fillOpacity={0.08} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend items={[{ key: "traceCount", label: "Trace 数", color: BLUE }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
        <Panel
          title="活跃用户趋势"
          subtitle="DAU · 时间桶内至少发起 1 次有效 Trace 的去重用户"
          action={<span className="chart-unit">人</span>}
        >
          <EmptyChart>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 12, right: 14, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("DAU 活跃用户 · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={45} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toLocaleString("zh-CN"), "活跃用户"]} />
                <Area hide={hidden.dau} type="monotone" dataKey="dau" stroke={TEAL} strokeWidth={2.3} fill={TEAL} fillOpacity={0.09} activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend items={[{ key: "dau", label: "DAU", color: TEAL }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
        <Panel
          title="工具调用次数分布"
          subtitle="Top 10 工具及其他 · 按 tool.name 汇总"
          action={<span className="chart-unit">次</span>}
        >
          <div className="bar-chart-frame tool-bars">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOOL_CALLS} layout="vertical" margin={{ top: 4, right: 32, left: 6, bottom: 0 }} onClick={(entry) => entry?.activePayload?.[0]?.payload?.name && onDrill("工具 · " + entry.activePayload[0].payload.name, entry.activePayload[0].payload.name)}>
                <CartesianGrid stroke="#edf0f0" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} tick={{ fill: "#71817c", fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toLocaleString("zh-CN"), "调用次数"]} />
                <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={13} cursor="pointer">
                  {TOOL_CALLS.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={index === 0 ? 1 : 0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TokensView({ series, tokenTotal, inputTokens, outputTokens, hidden, onToggle, onDrill }) {
  return (
    <div className="view-content">
      <div className="metrics-grid metrics-three">
        <MetricCard label="总 Token 用量" value={formatCompact(tokenTotal)} trend="12.4%" tone="green" icon={Stack} onClick={() => onDrill("总 Token", null)} />
        <MetricCard label="输入 Token" value={formatCompact(inputTokens)} trend="9.2%" tone="blue" icon={ArrowDownRight} onClick={() => onDrill("输入 Token", null)} />
        <MetricCard label="输出 Token" value={formatCompact(outputTokens)} trend="16.8%" tone="teal" icon={ArrowUpRight} onClick={() => onDrill("输出 Token", null)} />
      </div>
      <div className="section-heading">
        <div><span className="section-bar section-blue" /><h2>Token 用量</h2><span className="section-caption">总 Token = 输入 Token + 输出 Token</span></div>
        <span className="unit-chip">单位：Token</span>
      </div>
      <div className="chart-grid tokens-grid">
        <Panel
          title="Token 用量趋势"
          subtitle="按时间桶查看输入与输出 Token 的变化"
          className="panel-wide"
          action={<span className="chart-unit">Token</span>}
        >
          <EmptyChart className="chart-tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 14, right: 18, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("Token 用量 · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={54} tickFormatter={(value) => formatCompact(value)} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value, name) => [formatCompact(Number(value)), name === "totalTokens" ? "总 Token" : name === "input" ? "输入 Token" : "输出 Token"]} />
                <Line hide={hidden.tokenInput} type="monotone" dataKey="input" name="input" stroke={BLUE} strokeWidth={2.2} dot={false} activeDot={{ r: 4, fill: "#fff", strokeWidth: 2 }} />
                <Line hide={hidden.tokenOutput} type="monotone" dataKey="output" name="output" stroke={TEAL} strokeWidth={2.2} dot={false} activeDot={{ r: 4, fill: "#fff", strokeWidth: 2 }} />
                <Line hide={hidden.tokenTotal} type="monotone" dataKey="totalTokens" name="totalTokens" stroke={GREEN} strokeWidth={2.6} dot={false} activeDot={{ r: 4, fill: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend
            items={[
              { key: "tokenTotal", label: "总 Token", color: GREEN },
              { key: "tokenInput", label: "输入 Token", color: BLUE },
              { key: "tokenOutput", label: "输出 Token", color: TEAL },
            ]}
            hidden={hidden}
            onToggle={onToggle}
          />
        </Panel>
        <Panel
          title="模型 Token 用量分布"
          subtitle="Top 10 模型 · 按总 Token 降序"
          action={<span className="chart-unit">Token</span>}
        >
          <div className="bar-chart-frame model-token-bars">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MODEL_TOKENS} layout="vertical" margin={{ top: 4, right: 50, left: 5, bottom: 0 }} onClick={(entry) => entry?.activePayload?.[0]?.payload?.name && onDrill("模型 · " + entry.activePayload[0].payload.name, entry.activePayload[0].payload.name)}>
                <CartesianGrid stroke="#edf0f0" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={114} tickLine={false} axisLine={false} tick={{ fill: "#71817c", fontSize: 11 }} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toFixed(1) + "M", "Token"]} />
                <Bar hide={hidden.modelInput} dataKey="input" name="输入 Token" stackId="tokens" fill={GREEN} barSize={13} cursor="pointer" />
                <Bar hide={hidden.modelOutput} dataKey="output" name="输出 Token" stackId="tokens" fill={BLUE} radius={[0, 5, 5, 0]} barSize={13} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ToggleLegend items={[{ key: "modelInput", label: "输入 Token", color: GREEN }, { key: "modelOutput", label: "输出 Token", color: BLUE }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
        <Panel
          title="用户 Token 用量 TOP10"
          subtitle="按总 Token 用量降序 · 点击用户查看明细"
          action={<span className="chart-unit">Token</span>}
        >
          <div className="bar-chart-frame user-token-bars">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={USER_TOKENS}
                layout="vertical"
                margin={{ top: 4, right: 44, left: 4, bottom: 0 }}
                onClick={(entry) => {
                  const user = entry?.activePayload?.[0]?.payload;
                  if (user) onDrill("用户 · " + user.name, user.userId);
                }}
              >
                <CartesianGrid stroke="#edf0f0" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 10 }} tickFormatter={(value) => formatCompact(value)} />
                <YAxis type="category" dataKey="displayName" width={76} tickLine={false} axisLine={false} tick={{ fill: "#71817c", fontSize: 10 }} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  labelFormatter={(_, payload) => {
                    const user = payload?.[0]?.payload;
                    return user ? user.name + " · " + user.department + " · 总 Token " + formatCompact(user.total) : "";
                  }}
                  formatter={(value, name) => [formatCompact(Number(value)), name]}
                />
                <Bar hide={hidden.userInput} dataKey="input" name="输入 Token" stackId="userTokens" fill={GREEN} barSize={13} cursor="pointer" />
                <Bar hide={hidden.userOutput} dataKey="output" name="输出 Token" stackId="userTokens" fill={BLUE} radius={[0, 5, 5, 0]} barSize={13} cursor="pointer">
                  <LabelList dataKey="total" position="right" formatter={(value) => formatCompact(Number(value))} fill="#60716a" fontSize={9} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ToggleLegend items={[{ key: "userInput", label: "输入 Token", color: GREEN }, { key: "userOutput", label: "输出 Token", color: BLUE }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
      </div>
      <div className="note-banner"><Eye size={16} /><span>用户排名按输入与输出 Token 总量计算，不含缓存 Token；点击用户可下钻用量明细。</span></div>
    </div>
  );
}

function ModelPicker({ models, selected, onChange }) {
  const toggleModel = (name) => {
    onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  };
  return (
    <details className="model-picker">
      <summary aria-label="筛选模型">
        <span>模型 {selected.length}/{models.length}</span><CaretDown size={12} weight="bold" />
      </summary>
      <div className="model-picker-menu">
        <div className="model-picker-actions">
          <span>选择要对比的模型</span>
          <button type="button" onClick={() => onChange(models.slice(0, 5).map((model) => model.name))}>默认 Top 5</button>
          <button type="button" onClick={() => onChange([])}>清空</button>
        </div>
        <div className="model-picker-list">
          {models.map((model) => (
            <label key={model.name}>
              <input type="checkbox" checked={selected.includes(model.name)} onChange={() => toggleModel(model.name)} />
              <span>{model.name}</span>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

function PerformanceView({ series, hidden, onToggle, onDrill }) {
  const [metricKey, setMetricKey] = useState("callAvg");
  const [selectedModels, setSelectedModels] = useState(() => MODEL_LATENCY.slice(0, 5).map((model) => model.name));
  const metric = MODEL_PERFORMANCE_METRICS.find((item) => item.value === metricKey) ?? MODEL_PERFORMANCE_METRICS[0];
  const modelData = MODEL_LATENCY.filter((model) => selectedModels.includes(model.name));
  const modelSeries = series.map((point, pointIndex) => {
    const row = { ...point };
    modelData.forEach((model) => {
      const modelIndex = MODEL_LATENCY.findIndex((item) => item.name === model.name);
      const wave = 1 + Math.sin(pointIndex / 3.2 + modelIndex * 0.65) * 0.11 + Math.max(0, Math.sin(pointIndex / 4 + modelIndex)) * 0.07;
      row[model.name] = Number((model[metricKey] * wave).toFixed(2));
      row[`${model.name}__samples`] = Math.round(720 + Math.sin(pointIndex / 3 + modelIndex) * 125 + modelIndex * 37);
    });
    return row;
  });
  const formatMetric = (value) => `${Number(value).toFixed(metric.unit === "Token/s" ? 1 : 2)} ${metric.unit}`;
  return (
    <div className="view-content">
      <div className="metrics-grid metrics-two">
        <MetricInlineCard label="端到端对话耗时" main="12.8s" color="blue" note="有效样本 26.3 万" values={[{ label: "P50", value: "12.8s" }, { label: "P90", value: "38.5s" }, { label: "P99", value: "128s" }]} />
        <MetricInlineCard label="首 Token 耗时" main="0.82s" color="teal" note="有效样本 25.9 万" values={[{ label: "P50", value: "0.82s" }, { label: "P90", value: "2.35s" }, { label: "P99", value: "6.80s" }]} />
      </div>
      <div className="section-heading">
        <div><span className="section-bar section-teal" /><h2>响应性能</h2><span className="section-caption">仅统计具有有效耗时样本的 Trace</span></div>
      </div>
      <div className="chart-grid">
        <Panel
          title="对话耗时趋势"
          subtitle="端到端对话与首 Token 耗时 · P50 / P90 / P99"
          action={<span className="chart-unit">秒</span>}
        >
          <EmptyChart>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 12, right: 14, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("耗时样本 · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={45} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toFixed(2) + "s"]} />
                <Line hide={hidden.endP50} type="monotone" dataKey="endP50" name="端到端 P50" stroke={BLUE} strokeWidth={2.1} dot={false} />
                <Line hide={hidden.endP90} type="monotone" dataKey="endP90" name="端到端 P90" stroke={AMBER} strokeWidth={2.1} dot={false} />
                <Line hide={hidden.endP99} type="monotone" dataKey="endP99" name="端到端 P99" stroke={RED} strokeWidth={2.1} dot={false} />
                <Line hide={hidden.firstP50} type="monotone" dataKey="firstP50" name="首 Token P50" stroke="#4eb9e2" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                <Line hide={hidden.firstP90} type="monotone" dataKey="firstP90" name="首 Token P90" stroke="#e2af4c" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
                <Line hide={hidden.firstP99} type="monotone" dataKey="firstP99" name="首 Token P99" stroke="#ef8d78" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend
            items={[
              { key: "endP50", label: "端到端 P50", color: BLUE },
              { key: "endP90", label: "端到端 P90", color: AMBER },
              { key: "endP99", label: "端到端 P99", color: RED },
              { key: "firstP50", label: "首 Token P50", color: "#4eb9e2" },
              { key: "firstP90", label: "首 Token P90", color: "#e2af4c" },
              { key: "firstP99", label: "首 Token P99", color: "#ef8d78" },
            ]}
            hidden={hidden}
            onToggle={onToggle}
          />
        </Panel>
        <Panel
          title="模型性能趋势"
          subtitle="按指标与模型对比调用耗时、首 Token 耗时及输出 TPS"
          action={
            <div className="panel-controls">
              <label className="metric-select">
                <span>指标</span>
                <select aria-label="模型性能指标" value={metricKey} onChange={(event) => setMetricKey(event.target.value)}>
                  {MODEL_PERFORMANCE_METRICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <CaretDown size={11} weight="bold" />
              </label>
              <ModelPicker models={MODEL_LATENCY} selected={selectedModels} onChange={setSelectedModels} />
            </div>
          }
        >
          {modelData.length ? (
            <EmptyChart>
              <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={modelSeries}
                margin={{ top: 12, right: 14, left: -12, bottom: 0 }}
                onClick={(state) => {
                  if (!state?.activeLabel) return;
                  const modelName = state.activePayload?.find((item) => modelData.some((model) => model.name === item.dataKey))?.dataKey;
                  onDrill(modelName ? `模型性能 · ${modelName} · ${state.activeLabel}` : `模型性能 · ${state.activeLabel}`, modelName ?? null);
                }}
              >
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={55} tickFormatter={(value) => Number(value).toFixed(metric.unit === "Token/s" ? 0 : 1) + (metric.unit === "Token/s" ? " t/s" : "s")} />
                <Tooltip
                  {...CHART_TOOLTIP}
                  formatter={(value) => [formatMetric(value)]}
                  content={({ active, payload, label }) => active && payload?.length ? (
                    <div className="model-performance-tooltip">
                      <div className="model-tooltip-heading">{label} · {metric.label}</div>
                      {payload.filter((item) => typeof item.value === "number").map((item) => (
                        <div className="model-tooltip-row" key={item.dataKey}>
                          <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
                          <b>{formatMetric(item.value)}</b>
                          <small>{Number(item.payload?.[`${item.dataKey}__samples`] ?? 0).toLocaleString("zh-CN")} 次</small>
                        </div>
                      ))}
                    </div>
                  ) : null}
                />
                {modelData.map((model, index) => (
                  <Line
                    key={model.name}
                    hide={hidden[model.name]}
                    type="monotone"
                    dataKey={model.name}
                    name={model.name}
                    stroke={CHART_COLORS[MODEL_LATENCY.findIndex((item) => item.name === model.name) % CHART_COLORS.length]}
                    strokeWidth={index === 0 ? 2.4 : 1.8}
                    dot={false}
                  />
                ))}
              </LineChart>
              </ResponsiveContainer>
            </EmptyChart>
          ) : (
            <div className="model-chart-empty">至少选择一个模型以查看趋势</div>
          )}
          <div className="legend-row model-legend">
            {modelData.map((model, index) => (
              <button className={"legend-item" + (hidden[model.name] ? " legend-muted" : "")} key={model.name} onClick={() => onToggle(model.name)}>
                <span className="legend-dot" style={{ backgroundColor: CHART_COLORS[MODEL_LATENCY.findIndex((item) => item.name === model.name) % CHART_COLORS.length] }} />{model.name}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function QualityView({ series, hidden, onToggle, onDrill }) {
  return (
    <div className="view-content">
      <div className="metrics-grid metrics-three">
        <MetricCard label="异常 Trace" value="1,284" unit="条" trend="6.2%" down tone="amber" icon={WarningCircle} onClick={() => onDrill("异常 Trace", null)} />
        <MetricCard label="对话异常率" value="2.7" unit="%" trend="0.4%" down tone="red" icon={Pulse} onClick={() => onDrill("对话异常率", null)} />
        <MetricCard label="调用异常率" value="1.3" unit="%" trend="0.2%" down tone="teal" icon={Gauge} onClick={() => onDrill("调用异常率", null)} />
      </div>
      <div className="section-heading">
        <div><span className="section-bar section-amber" /><h2>运行质量</h2><span className="section-caption">异常率 = 异常调用数 / 已结束调用数</span></div>
      </div>
      <div className="chart-grid quality-grid">
        <Panel
          title="对话异常趋势"
          subtitle="异常 Trace 数量及其在已结束 Trace 中的占比"
          action={<span className="chart-unit">条 / %</span>}
        >
          <EmptyChart>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={series} margin={{ top: 12, right: 15, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("异常 Trace · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis yAxisId="count" tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={40} />
                <YAxis yAxisId="rate" orientation="right" tickLine={false} axisLine={false} tick={{ fill: AMBER, fontSize: 11 }} width={42} tickFormatter={(value) => Number(value).toFixed(1) + "%"} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value, name) => [name === "异常率" ? Number(value).toFixed(2) + "%" : Number(value).toLocaleString("zh-CN"), name]} />
                <Bar yAxisId="count" hide={hidden.abnormalCount} dataKey="abnormal" name="异常 Trace" fill={AMBER} fillOpacity={0.42} radius={[4, 4, 0, 0]} barSize={15} />
                <Line yAxisId="rate" hide={hidden.abnormalRate} type="monotone" dataKey="abnormalRate" name="异常率" stroke="#b87b28" strokeWidth={2.3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend items={[{ key: "abnormalCount", label: "异常 Trace 数", color: AMBER }, { key: "abnormalRate", label: "异常率", color: "#b87b28" }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
        <Panel
          title="模型 / 工具调用异常率趋势"
          subtitle="按已结束的模型与工具调用统计异常率"
          action={<span className="chart-unit">%</span>}
        >
          <EmptyChart>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 12, right: 14, left: -12, bottom: 0 }} onClick={(state) => state?.activeLabel && onDrill("调用异常 · " + state.activeLabel, null)}>
                <CartesianGrid stroke="#edf0f0" vertical={false} />
                <XAxis dataKey="time" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: MUTED, fontSize: 11 }} width={42} tickFormatter={(value) => Number(value).toFixed(1) + "%"} />
                <Tooltip {...CHART_TOOLTIP} formatter={(value) => [Number(value).toFixed(2) + "%"]} />
                <Line hide={hidden.modelRate} type="monotone" dataKey="modelRate" name="模型调用" stroke={VIOLET} strokeWidth={2.4} dot={false} />
                <Line hide={hidden.toolRate} type="monotone" dataKey="toolRate" name="工具调用" stroke="#126f95" strokeWidth={2.4} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </EmptyChart>
          <ToggleLegend items={[{ key: "modelRate", label: "模型调用", color: VIOLET }, { key: "toolRate", label: "工具调用", color: "#126f95" }]} hidden={hidden} onToggle={onToggle} />
        </Panel>
        <Panel title="模型调用异常分布" subtitle="Top 10 模型 · 按异常数降序" action={<span className="chart-unit">次</span>}>
          <ErrorBars data={MODEL_ERRORS} color={GREEN} onClick={(name) => onDrill("模型异常 · " + name, name)} />
        </Panel>
        <Panel title="工具调用异常分布" subtitle="Top 10 工具 · 按异常数降序" action={<span className="chart-unit">次</span>}>
          <ErrorBars data={TOOL_ERRORS} color={RED} onClick={(name) => onDrill("工具异常 · " + name, name)} />
        </Panel>
      </div>
    </div>
  );
}

function ErrorBars({ data, color, onClick }) {
  return (
    <div className="bar-chart-frame error-bars">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 78, left: 4, bottom: 0 }} onClick={(entry) => entry?.activePayload?.[0]?.payload?.name && onClick(entry.activePayload[0].payload.name)}>
          <CartesianGrid stroke="#edf0f0" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={{ stroke: "#dce2e2" }} tick={{ fill: MUTED, fontSize: 10 }} />
          <YAxis type="category" dataKey="name" width={118} tickLine={false} axisLine={false} tick={{ fill: "#71817c", fontSize: 11 }} />
          <Tooltip {...CHART_TOOLTIP} formatter={(value, name, item) => [Number(value).toLocaleString("zh-CN") + " 次 · " + item.payload.rate + "%", "异常调用"]} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={12} cursor="pointer">
            {data.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? color : CHART_COLORS[(index + 1) % CHART_COLORS.length]} fillOpacity={index === 0 ? 0.96 : 0.75} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default App;
