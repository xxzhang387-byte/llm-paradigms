// 范式元数据。category: 'toC' | 'toB'。id 映射路由 + demo 页。
export const PARADIGMS = [
  // ===================== toC =====================
  {
    id: 'chat', category: 'toC', n: 'C1', icon: '💬', title: '对话即产品', en: 'Chat-native', tag: '模型即界面',
    blurb: 'LLM 本身就是产品。用户自带任务，直接对话。代表：ChatGPT、Claude、豆包。', accent: '#8fa3bf',
  },
  {
    id: 'companion', category: 'toC', n: 'C2', icon: '🫂', title: '角色陪伴', en: 'Companion', tag: '卖情感关系',
    blurb: '把模型包装成有人格的角色，卖陪伴而非效率。代表：Character.AI、星野。', accent: '#c59b9b',
  },
  {
    id: 'create', category: 'toC', n: 'C3', icon: '🎨', title: '创作工具', en: 'Co-creation', tag: '要产出物',
    blurb: '模型作为生产力工具，用户要的是可反复打磨的产出。代表：Notion AI、文案/图像生成。', accent: '#c9ac7e',
  },
  {
    id: 'copilot', category: 'toC', n: 'C4', icon: '✍️', title: '嵌入式 Copilot', en: 'Copilot', tag: '增强已有操作',
    blurb: '把 AI 塞进已有高频场景，0 迁移成本。代表：浏览器侧栏、文档助手、输入法 AI。', accent: '#8fa687',
  },
  {
    id: 'agent', category: 'toC', n: 'C5', icon: '🤖', title: '任务代理 Agent', en: 'Agent', tag: '替你把事办完',
    blurb: '给目标，模型自己拆解、分步执行、交付结果。代表：Manus、Deep Research。', accent: '#a997b5',
  },
  {
    id: 'answer', category: 'toC', n: 'C6', icon: '🔍', title: '答案引擎', en: 'AI-native rebuild', tag: '用 AI 重做老品类',
    blurb: 'AI 藏在背后，对标某个老品类拉开体验代差。代表：Perplexity 重做搜索。', accent: '#82aba3',
  },
  {
    id: 'router', category: 'toC', n: 'C7', icon: '🔀', title: '聚合 / 路由层', en: 'Meta layer', tag: '卡在用户与模型间',
    blurb: '聚合多模型做分发与对比，收过路费。代表：Poe、各类全家桶入口。', accent: '#c98f7d',
  },

  // ===================== toB =====================
  {
    id: 'rag', category: 'toB', n: 'B1', icon: '🗄️', title: '企业知识库问答', en: 'Enterprise RAG', tag: '让企业文档可问答',
    blurb: '把散落的企业文档变成可问答、可溯源的知识中枢。代表：Glean、各类知识中台。', accent: '#82aba3',
  },
  {
    id: 'bizcopilot', category: 'toB', n: 'B2', icon: '🧑‍💼', title: '行业 SaaS 副驾', en: 'Vertical Copilot', tag: '嵌入业务系统',
    blurb: '深度嵌入 CRM/HR/法务等业务系统的垂直副驾，读写业务对象。代表：销售/客服 Copilot。', accent: '#8fa3bf',
  },
  {
    id: 'support', category: 'toB', n: 'B3', icon: '🎧', title: '智能客服', en: 'AI Support', tag: '自动应答+坐席辅助',
    blurb: '知识驱动的自动应答 + 坐席实时辅助，可溯源、可转人工。代表：各家 AI 客服。', accent: '#8fa687',
  },
  {
    id: 'bizagent', category: 'toB', n: 'B4', icon: '⚙️', title: '流程自动化 Agent', en: 'Process Agent', tag: '跨系统执行业务流程',
    blurb: '给目标，Agent 跨系统拆解执行业务流程，不可逆动作人工审批。代表：AI 运营/RPA。', accent: '#a997b5',
  },
  {
    id: 'bi', category: 'toB', n: 'B5', icon: '📈', title: '对话式数据分析', en: 'Conversational BI', tag: '自然语言查数出报表',
    blurb: '自然语言转 SQL、自助查数出报表，降低看数门槛。代表：各家 NL2SQL / AI BI。', accent: '#c9ac7e',
  },
  {
    id: 'docintel', category: 'toB', n: 'B6', icon: '📑', title: '文档智能', en: 'Document Intelligence', tag: '抽取·审阅·比对',
    blurb: '对合同/发票/报告做要素抽取、风险审阅、版本比对，人审复核闭环。代表：合同智审。', accent: '#c59b9b',
  },
  {
    id: 'platform', category: 'toB', n: 'B7', icon: '🏗️', title: '企业 AI 平台', en: 'LLMOps Platform', tag: '模型与 Agent 治理',
    blurb: '统一模型接入、Agent 编排、评测监控与护栏治理的企业 AI 中台。代表：各家 LLMOps。', accent: '#c98f7d',
  },
]

export const byId = (id) => PARADIGMS.find((p) => p.id === id)
export const byCategory = (cat) => PARADIGMS.filter((p) => p.category === cat)
