# CIBWork 运营看板 Demo

React + Vite 单页运营看板原型。页面只使用 `src/mockData.js` 中的 mock 数据，不连接业务后端。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 原型范围

- **用户流量**：会话数、DAU、Token 用量、耗时与异常率概览，趋势图和工具调用分布。
- **Token 用量**：总量、输入量、输出量趋势及模型维度用量分布。
- **性能耗时**：端到端与首 Token 的 P50/P90/P99 趋势；模型趋势支持 Top 5/10/20 与分位数切换。
- **质量状态**：对话异常趋势、模型/工具调用异常率趋势及异常分布。
- 应用筛选：全部应用、QwenPaw。
- 任务场景：全部场景、对话服务、自动化任务。
- 会话追踪仅作为侧边栏禁用入口保留，本期不含追踪页面。
- 控件使用 `#355eb8` 和白灰色；指标卡和图表使用独立配色。

## 离线预览包

仓库根目录的 [CIBWork-运营看板-离线预览.zip](./CIBWork-运营看板-离线预览.zip) 可转发给他人：解压后 Windows 双击 `start.bat`，macOS 双击 `start-mac.command`。macOS 需要 Python 3。预览服务只监听本机，不需要部署；启动窗口保持打开，按 Ctrl+C 停止。

## 项目结构

- `src/`：看板页面、样式和 mock 数据。
- `worker/`、`.openai/`、`scripts/`：Sites 静态应用托管配置。
- `tests/`：Sites worker 测试。