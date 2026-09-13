# LLM 范式工作台 · 14 个大模型产品 Demo

一个 React + Vite 站点：按「LLM 在产品里扮演什么角色」切分出 **toC 7 种 + toB 7 种产品范式**，每个范式点进去都是一个**真实调用大模型**的可玩 demo，外加一页产品方法论（含 PRD / 提案 / PPT 生成）。

- 界面：**莫兰迪配色 × 新拟物（Neumorphism）**，柔影浮雕、内嵌输入、丝滑按压反馈
- 登录：首次进入需选择服务商/模型并填入**你自己的 API Key**（仅存浏览器 localStorage）
- 部署：前端静态构建 + 单个 Netlify Function（复用同一套 Express 代理，支持流式）

## 范式

| # | 范式 | demo |
|---|------|------|
| 01 | 对话即产品 (Chat-native) | 纯聊天，流式 |
| 02 | 角色陪伴 (Companion) | 三个不同人格的角色，语气各异 |
| 03 | 创作工具 (Co-creation) | 选类型 → 生成 → 换一个 / 更长 / 更短 |
| 04 | 嵌入式 Copilot | 编辑器里选中文字 → AI 改写/续写 → 一键应用 |
| 05 | 任务代理 Agent | 给目标 → 自动拆解计划 → 逐步执行 |
| 06 | 答案引擎 (AI-native rebuild) | 联网检索 + 结构化答案 + 来源 |
| 07 | 聚合 / 路由层 | 同一 prompt 并排对比两个模型 |

## 范式方法论页

每个范式页右上角有 **📖 产品方法论** 入口（首页卡片也有），进入后是一页 curated 知识：
产品设计要点 · 适用领域 · PRD 预览 · PRD 撰写要点 · 数据监测点 · 数据要素 · 主要应用案例。

其中 **PRD 预览** 卡片可点击进入 `/prd/:id` —— 一个 **AI 生成完整 PRD** 的页面：

- 用资深 LLM 产品专家的 system prompt（去 AI 味、拒绝常识堆砌、突出 LLM 独特性：幻觉控制 / 流式 / Token 成本 / 降级兜底 / 安全审核 / Prompt 工程）
- 每个范式预置一份具体示例产品的「产品基本信息」（产品名 / 目标用户 / 核心大模型能力 / 核心痛点），**字段可编辑** —— 也能给你自己的产品生成；还能**从产品库一键导入**
- 点「✨ 生成完整 PRD」流式产出一份含 *文档信息表 · 产品概述与核心价值 · 用户角色表 · 核心功能深拆（交互逻辑 + LLM 特有逻辑）· 非功能需求（TTFT/上下文窗口/合规过滤/幻觉抑制）· 埋点与数据看板（Token 消耗/点赞点踩闭环）· 风险与熔断降级* 的完整 Markdown 文档
- 用 react-markdown + remark-gfm 渲染表格/块引用/分隔线；结果缓存在本地，可**复制 Markdown / 打印导出 PDF / 重新生成**
- 另保留一份**结构化基线**（静态，无需 API key 即可查看）作为离线兜底

PRD 生成的服务端逻辑在 `/api/prd`（system prompt 在服务端，保证一致），同样支持 Claude / DeepSeek。

## AI 产品顾问 Agent（首页 🧭）

1. 填入你的产品（定位 / 目标人群 / 界面形态 / 主要功能…），可**保存到产品库**（localStorage 持久化，可多个、可加载、可删除）。
2. 填写目标或当前问题（增长 / 粘性 / 卡点…）。
3. 点「咨询专家」→ Claude 做 **3-4 步专家诊断 → 推荐范式（含次选）→ 把范式落地到你这个产品的方案 → demo 设想 → 注意要点**，并给出跳到对应 demo / 方法论页的入口。
4. 后端用结构化输出（json_schema）保证推荐落在 7 个范式之一。

## 架构

```
浏览器 (React, 登录页收集 key 存入 localStorage)
      ──/api (Authorization: Bearer <用户的 key>)──▶  服务端代理  ──▶  Claude / DeepSeek API
```

- 本地开发：Express 代理（`server/`），Vite 把 `/api` 转发到 8787
- Netlify：同一个 Express app（`server/app.js`）被 `netlify/functions/api.js` 包装为 Function（路径 `/api/*`），流式响应原样透传
- Key 不入库、不落服务端：每次请求由浏览器带上，代理仅做转发

## 登录与模型设置（Claude + DeepSeek）

首次打开会进入登录页，完成三步才能进入工作台：

1. **选服务商**：Claude (Anthropic) / DeepSeek
2. **选模型**：Opus 4.8 / Sonnet 4.6 / Haiku 4.5；DeepSeek-V3 (chat) / DeepSeek-R1 (reasoner)
3. **填自己的 API Key**（可先「测试连接」）；Base URL 可选（代理中转/兼容端点）

右下角悬浮 **⚙️ 模型设置**可随时更换模型、Key 或退出登录。

DeepSeek 走 OpenAI 兼容协议（`https://api.deepseek.com`）。注意：**答案引擎**的联网检索仅 Claude 支持，DeepSeek 会自动降级为模型内置知识回答。
「聚合/路由层」demo 可**跨服务商**并排对比（如 Opus 4.8 vs DeepSeek-V3）。

## 本地运行

```bash
npm install
npm run dev        # 同时起 Express 代理 (8787) 与 Vite (5173)
```

然后打开 http://localhost:5173 ，按登录页提示填入你自己的 key 即可。

- 服务端环境变量 `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY` 为可选项，仅作为 key 缺省时的兜底
- 答案引擎用 `web_search` 服务端工具；若 key 未开通该工具，会自动回退到模型内置知识并提示

## 部署到 Netlify

仓库已内置 `netlify.toml` 与 `netlify/functions/api.js`：

- Build command: `npm run build`
- Publish directory: `dist`
- Function: `api`（Node 20，托管全部 `/api/*`）

在 Netlify 控制台「Add new site → Import an existing project」选择本仓库即可一键发布；无需在 Netlify 配置任何密钥环境变量（用户在登录页自带 key）。

## 文件

- `server/index.js` — 代理：`/api/chat`（流式）、`/api/complete`（含结构化输出）、`/api/answer`（联网检索）
- `src/paradigms.js` — 7 个范式的元数据（首页卡片）
- `src/pages/*` — 每个范式一个页面
- `src/api.js` — 前端调用封装
