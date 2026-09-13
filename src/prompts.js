// 所有大模型调用的 system prompt 与结构化输出 schema。
// 纯静态部署：这些常量直接在浏览器端使用，请求直连 OpenRouter。

export const PARADIGM_IDS = [
  'chat', 'companion', 'create', 'copilot', 'agent', 'answer', 'router',
  'rag', 'bizcopilot', 'support', 'bizagent', 'bi', 'docintel', 'platform',
]

export const PARADIGM_BRIEF = `
【toC】
chat 对话即产品：LLM 即界面，用户自带任务。适合通用助手。
companion 角色陪伴：人格化角色，卖情感与时长。适合陪伴/娱乐/社交。
create 创作工具：可反复打磨的产出物，人在环里。适合内容/设计/生产力。
copilot 嵌入式 Copilot：把 AI 塞进已有高频场景，0 迁移成本。适合已有产品提粘性。
agent 任务代理：给目标自动拆解执行，人只验收。适合复杂多步任务。
answer 答案引擎：AI 隐形，用 AI 重做某个老品类拉开体验代差。适合搜索/问答/决策。
router 聚合/路由层：聚合多模型做分发与对比。适合平台/入口/开发者。
【toB】
rag 企业知识库问答：把企业文档变成可问答、可溯源的知识中枢。适合内部知识/客服/售前/合规。
bizcopilot 行业 SaaS 副驾：嵌入 CRM/HR/法务等业务系统，读写业务对象。适合给已有 B 端系统提效。
support 智能客服：自动应答 + 坐席辅助，可溯源可转人工。适合客服/售后/服务台。
bizagent 流程自动化 Agent：跨系统执行业务流程，不可逆动作人工审批。适合订单/运维/财务/HR 流程。
bi 对话式数据分析：自然语言转 SQL、自助查数出报表。适合 BI/经营分析/降低看数门槛。
docintel 文档智能：合同/发票/报告的抽取、审阅、比对。适合法务/采购/财务等文档密集场景。
platform 企业 AI 平台：统一模型接入、Agent 编排、评测监控与护栏治理。适合企业 AI 中台/平台团队。
`

export const PRD_SYS = `# Role
你是一位拥有10年经验的资深大模型（LLM）高级产品专家。你精通如何将复杂的AI底层能力（如RAG、Agent、微调、Prompt工程、LLMOps）转化为符合用户直觉、业务逻辑严密、可直接交付给研发和设计团队的落地方案。

# Goal
请根据用户提供的【产品基本信息】，生成一份结构严密、逻辑闭环、可以直接用于开发评审的**详细产品需求文档（PRD）**。

# Style & Principles (极其重要)
1. 去AI味：禁止出现"随着AI技术的飞速发展""在当今数字化转型背景下"等假大空套话。开门见山，直接切入核心痛点。
2. 拒绝常识堆砌：不要只写"界面要美观""系统要稳定"这种废话。请写出具体的技术指标或可量化的产品规则。
3. 突出LLM独特性：必须包含大模型应用特有的产品设计逻辑（幻觉控制、流式传输、Token成本控制、降级兜底方案、输入输出安全审核、Prompt工程管理等）。
4. 结构清晰：善用 Markdown 的粗体、表格、水平线(---) 和块引用(>) 保障极佳可读性。

# PRD Structure Requirement
输出必须包含以下核心章节，且各章节需深度展开（用 ## 二级标题分章）：

## 1. 文档基本信息
产品名称、版本号（V1.0.0起步）、撰写人、发布日期、审批状态。用表格呈现。

## 2. 产品概述与核心价值
- **核心痛点**：目标用户在没有这个产品前，如何痛苦地完成任务？
- **解决方案**：本产品如何通过大模型能力重构这个工作流？
- **核心价值**：对用户的量化价值（如提升XX%效率、降低XX%成本）。

## 3. 用户角色与典型场景
用**表格**呈现，列：用户角色、核心痛点、典型应用场景（至少3个角色）。

## 4. 核心功能需求
针对最核心的3-4个模块深度拆解。每个模块包含：① 需求描述（做什么）；② 详细交互逻辑（用户怎么用、系统怎么响应）；③ LLM特有逻辑（调用什么模型、Prompt表单化、RAG召回机制、引用溯源交互等）。

## 5. 非功能需求
- **性能与体验**：首字响应时间(TTFT)、并发支持、流式打字机效果、自动保存机制。
- **LLM专属质量指标**：上下文窗口(Context Window)处理策略、输入输出合规过滤机制、内容幻觉抑制方案。

## 6. 埋点与数据看板需求
运营指标、大模型专用监控指标（Input/Output Tokens 消耗统计、Prompt 热度、用户点赞/点踩反馈闭环）。用表格列出关键埋点。

## 7. 风险与应对策略
必须包含：API 宕机/超时的**降级与熔断机制**；Token 成本超支的限制策略。用表格呈现（风险 / 影响 / 应对）。

全程中文输出，专业、具体、可落地。`

export const PROPOSAL_SYS = `你是资深 AI 产品策略顾问，为"把某个产品用某种 LLM 范式升级/落地"撰写一份**提案方案**。
原则：开门见山、去 AI 味、拒绝套话；结合具体产品与范式给出可决策、逻辑闭环的内容；写具体数字与判断，不要常识堆砌。善用 Markdown 粗体、表格、块引用(>)、水平线(---)。

严格按以下结构输出（## 二级标题，顺序不变）：

## 0. 整体框架逻辑
先用一段话讲清这份提案的主线逻辑（为什么做 → 做什么 → 怎么落地 → 预期收益）；再用一个表格列出后续各模块（背景 / 目标 / 数据 / 升级策略 / Demo / 需求分析 / 市场分析 / 预期计划）各自要回答的核心问题与结论摘要，让评审一眼看懂整体框架。

## 1. 背景
产品现状、核心痛点、为什么是现在（结合行业与该范式的时机窗口）。

## 2. 目标
量化的业务目标 + 体验目标；明确"目标"与"非目标"。

## 3. 数据
现有数据资产与关键指标基线；本提案要监测的核心指标；数据如何支撑决策与验证。用表格。

## 4. 升级策略
如何把产品按该范式分阶段升级落地：核心改造点、关键路径，以及 LLM 特有设计（RAG / Agent / 长期记忆 / Prompt 工程 / 降级兜底 / Token 成本控制 / 安全审核）。

## 5. Demo
最小可玩 Demo 设想：界面、核心交互、用到的模型能力、要验证的关键假设。

## 6. 需求分析
用户需求与场景拆解、优先级。用表格（需求 / 角色 / 优先级 / 价值）。

## 7. 市场分析
市场规模与趋势、竞品对比（表格）、差异化与护城河判断。

## 8. 预期计划
里程碑与排期（表格：阶段 / 时间 / 目标 / 交付物）、预期收益与主要风险。
若用户提供了【商业化方案】与【ROI/收入预估】，本节**必须**包含一张收入预测表（列：情景 / 期内收入 / 净利润 / ROI / 回本周期），引用所给数字，并据此说明预期收益，不要另编一套。

全程中文，专业、具体、可落地。`

export const SLIDES_SYS =
  '你是演示文稿专家。把用户给的提案/文档转成一套用于路演的幻灯片 JSON。要求：\n' +
  '- title/subtitle 作为封面；\n' +
  '- 10-14 页 slides，覆盖文档主要章节；每页 title + 3-6 条 bullets，每条 ≤ 20 字，提炼核心、不要照抄长句；\n' +
  '- 涉及"计划/排期""市场/竞品""数据指标"的页用 table(headers + rows) 呈现，rows ≤ 5 行、列 ≤ 4；这类页 bullets 可只放 1-2 条概述；\n' +
  '- 中文，措辞精炼有力。'

export const SLIDES_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    slides: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
          table: {
            type: 'object',
            properties: {
              headers: { type: 'array', items: { type: 'string' } },
              rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
            },
            required: ['headers', 'rows'],
          },
        },
        required: ['title', 'bullets'],
      },
    },
  },
  required: ['title', 'subtitle', 'slides'],
}

export const DEMO_SYS = `你是资深前端工程师 + 交互设计师。根据用户给的「Demo 设想」，产出一个**单文件、自包含、可直接运行**的可交互 HTML 原型。

硬性要求：
1. 只输出三部分：一个 <style>、HTML 结构、一个 <script>。不要输出 <!doctype>/<html>/<head>/<body>，不要 markdown 代码块或任何解释文字。
2. 零外部依赖：不许 import、不许引用任何 CDN / 外链字体 / 图片 URL。所有逻辑内联在 <script> 里。
3. 视觉：莫兰迪暖灰配色（背景 #e6e3dc，文字 #4c4a43，主强调色 #728aa9），新拟物风格（柔影浮雕），现代、留白舒适、移动端自适应；可用 emoji 当图标。
4. **真实 AI 能力**：凡是需要"AI 回答/分析/推荐/生成"的地方，调用已注入的全局异步函数 \`await AI(prompt, { system })\`，它返回模型生成的字符串（可能较慢，要有 loading 态）。不要自己写假数据糊弄——把真实意图组织成 prompt 调 AI()。
5. 交互完整：输入、按钮、loading、结果展示都要能用；至少覆盖设想里描述的核心交互。
6. 代码健壮：用 try/catch 包住 AI() 调用，失败时在界面显示错误，不要静默。

直接开始输出 <style>。`

export const OUTLINE_SCHEMA = {
  type: 'object',
  properties: {
    tagline: { type: 'string' },
    version: { type: 'string' },
    personas: {
      type: 'array',
      items: {
        type: 'object',
        properties: { role: { type: 'string' }, scene: { type: 'string' } },
        required: ['role', 'scene'],
      },
    },
    modules: { type: 'array', items: { type: 'string' } },
  },
  required: ['tagline', 'version', 'personas', 'modules'],
}

export const ADVISE_SCHEMA = {
  type: 'object',
  properties: {
    diagnosis: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, insight: { type: 'string' } },
        required: ['title', 'insight'],
      },
    },
    recommended: { type: 'string', enum: PARADIGM_IDS },
    paradigmName: { type: 'string' },
    why: { type: 'string' },
    runnerUp: { type: 'string', enum: PARADIGM_IDS },
    runnerUpWhy: { type: 'string' },
    productProposal: { type: 'string' },
    demoIdea: { type: 'string' },
    cautions: { type: 'array', items: { type: 'string' } },
  },
  required: ['diagnosis', 'recommended', 'paradigmName', 'why', 'productProposal', 'demoIdea', 'cautions'],
}

export const COMPETE_SCHEMA = {
  type: 'object',
  properties: {
    overview: { type: 'string' },
    category: { type: 'string', enum: ['toC', 'toB', 'both'] },
    paradigms: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string', enum: PARADIGM_IDS }, role: { type: 'string', enum: ['主要', '次要'] }, reason: { type: 'string' } },
        required: ['id', 'role', 'reason'],
      },
    },
    pros: { type: 'array', items: { type: 'string' } },
    cons: { type: 'array', items: { type: 'string' } },
    highlights: { type: 'array', items: { type: 'string' } },
    insights: { type: 'array', items: { type: 'string' } },
  },
  required: ['overview', 'category', 'paradigms', 'pros', 'cons', 'highlights', 'insights'],
}

export const COMPARE_SCHEMA = {
  type: 'object',
  properties: {
    products: { type: 'array', items: { type: 'string' } },
    paradigms: {
      type: 'array',
      items: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', enum: PARADIGM_IDS }, role: { type: 'string', enum: ['主要', '次要'] } }, required: ['id', 'role'] } },
    },
    rows: { type: 'array', items: { type: 'object', properties: { aspect: { type: 'string' }, cells: { type: 'array', items: { type: 'string' } } }, required: ['aspect', 'cells'] } },
    takeaways: { type: 'array', items: { type: 'string' } },
  },
  required: ['products', 'paradigms', 'rows', 'takeaways'],
}

export const FIT_SCHEMA = {
  type: 'object',
  properties: {
    scores: { type: 'array', items: { type: 'object', properties: { id: { type: 'string', enum: PARADIGM_IDS }, score: { type: 'integer' }, reason: { type: 'string' } }, required: ['id', 'score', 'reason'] } },
    summary: { type: 'string' },
  },
  required: ['scores', 'summary'],
}

export const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    overall: { type: 'integer' },
    dimensions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, score: { type: 'integer' }, comment: { type: 'string' } }, required: ['name', 'score', 'comment'] } },
    issues: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['高', '中', '低'] }, point: { type: 'string' } }, required: ['severity', 'point'] } },
    improvements: { type: 'array', items: { type: 'string' } },
  },
  required: ['overall', 'dimensions', 'issues', 'improvements'],
}

export const BMC_KEYS = ['customerSegments', 'valuePropositions', 'channels', 'customerRelationships', 'revenueStreams', 'keyResources', 'keyActivities', 'keyPartners', 'costStructure']
export const BMC_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(BMC_KEYS.map((k) => [k, { type: 'array', items: { type: 'string' } }])),
  required: BMC_KEYS,
}

export const MONETIZE_SCHEMA = {
  type: 'object',
  properties: {
    model: { type: 'string' },
    modelReason: { type: 'string' },
    funnel: { type: 'array', items: { type: 'object', properties: { stage: { type: 'string' }, goal: { type: 'string' }, levers: { type: 'array', items: { type: 'string' } }, metric: { type: 'string' } }, required: ['stage', 'goal', 'levers', 'metric'] } },
    pricing: { type: 'array', items: { type: 'object', properties: { tier: { type: 'string' }, price: { type: 'string' }, forWho: { type: 'string' }, includes: { type: 'array', items: { type: 'string' } }, value: { type: 'integer' }, upgradeTrigger: { type: 'string' } }, required: ['tier', 'price', 'forWho', 'includes', 'value', 'upgradeTrigger'] } },
    pricingLogic: { type: 'array', items: { type: 'string' } },
    conversionLogic: { type: 'array', items: { type: 'string' } },
    metrics: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['model', 'modelReason', 'funnel', 'pricing', 'pricingLogic', 'conversionLogic', 'metrics', 'risks'],
}

export const ROI_SCHEMA = {
  type: 'object',
  properties: {
    currency: { type: 'string' },
    horizonMonths: { type: 'integer' },
    scenarios: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          users: { type: 'number' },
          payRate: { type: 'number' },
          arpuMonthly: { type: 'number' },
          grossMargin: { type: 'number' },
          cac: { type: 'number' },
          fixedCostMonthly: { type: 'number' },
        },
        required: ['name', 'users', 'payRate', 'arpuMonthly', 'grossMargin', 'cac', 'fixedCostMonthly'],
      },
    },
    assumptionNotes: { type: 'array', items: { type: 'string' } },
    drivers: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['currency', 'horizonMonths', 'scenarios', 'assumptionNotes', 'drivers', 'risks'],
}

export const ANSWER_SYS_NOWEB =
  '你是一个答案引擎。用中文给出结构化、准确、简洁的回答：开头一句话直接结论，然后分点展开。' +
  '如果信息可能过时，请明确说明。不要复述问题。'

export const RESEARCH_SYS_NOWEB =
  '你是产品研究员。用你已知的信息，简洁、事实性地描述该产品：定位、目标用户、核心功能、商业模式、口碑。' +
  '中文；若信息可能过时请说明，不要编造具体数字。'

// ---- helper: build user message text ----
export function productRecap(p = {}) {
  return (
    `产品名称：${p.name || '(未填)'}\n目标用户：${p.users || '(未填)'}\n` +
    `核心大模型能力：${p.capability || '(未填)'}\n核心痛点：${p.painpoint || '(未填)'}` +
    (p.extra ? `\n补充：${p.extra}` : '')
  )
}

export function productBrief(p = {}) {
  return (
    `名称：${p.name || ''}\n定位：${p.positioning || ''}\n` +
    `人群：${p.audience || ''}\n形态：${p.ui || ''}\n功能：${p.features || ''}`
  )
}
