import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import ChatNative from './pages/ChatNative.jsx'
import Companion from './pages/Companion.jsx'
import CoCreation from './pages/CoCreation.jsx'
import Copilot from './pages/Copilot.jsx'
import Agent from './pages/Agent.jsx'
import AnswerEngine from './pages/AnswerEngine.jsx'
import RouterDemo from './pages/RouterDemo.jsx'
import BizDemo from './pages/BizDemo.jsx'
import RagDemo from './pages/biz/RagDemo.jsx'
import BiDemo from './pages/biz/BiDemo.jsx'
import SupportDemo from './pages/biz/SupportDemo.jsx'
import AgentBizDemo from './pages/biz/AgentBizDemo.jsx'
import DocIntelDemo from './pages/biz/DocIntelDemo.jsx'
import CopilotBizDemo from './pages/biz/CopilotBizDemo.jsx'
import PlatformDemo from './pages/biz/PlatformDemo.jsx'
import Knowledge from './pages/Knowledge.jsx'
import Prd from './pages/Prd.jsx'
import Proposal from './pages/Proposal.jsx'
import Advisor from './pages/Advisor.jsx'
import Compete from './pages/Compete.jsx'
import Workspace from './pages/Workspace.jsx'
import ProductWorkspace from './pages/ProductWorkspace.jsx'
import Flow from './pages/Flow.jsx'
import TopNav from './TopNav.jsx'
import SettingsModal from './SettingsModal.jsx'
import Onboarding from './Onboarding.jsx'
import { getConfig, isConfigured } from './modelConfig.js'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(isConfigured())
  const cfg = getConfig()

  if (!ready) return <Onboarding onDone={() => setReady(true)} />

  return (
    <>
      <ScrollToTop />
      <TopNav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/chat" element={<ChatNative />} />
        <Route path="/p/companion" element={<Companion />} />
        <Route path="/p/create" element={<CoCreation />} />
        <Route path="/p/copilot" element={<Copilot />} />
        <Route path="/p/agent" element={<Agent />} />
        <Route path="/p/answer" element={<AnswerEngine />} />
        <Route path="/p/router" element={<RouterDemo />} />
        <Route path="/p/rag" element={<RagDemo />} />
        <Route path="/p/bizcopilot" element={<CopilotBizDemo />} />
        <Route path="/p/support" element={<SupportDemo />} />
        <Route path="/p/bizagent" element={<AgentBizDemo />} />
        <Route path="/p/bi" element={<BiDemo />} />
        <Route path="/p/docintel" element={<DocIntelDemo />} />
        <Route path="/p/platform" element={<PlatformDemo />} />
        <Route path="/p/:id" element={<BizDemo />} />
        <Route path="/guide/:id" element={<Knowledge />} />
        <Route path="/prd/:id" element={<Prd />} />
        <Route path="/proposal/:id" element={<Proposal />} />
        <Route path="/advisor" element={<Advisor />} />
        <Route path="/compete" element={<Compete />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/workspace/:pid" element={<ProductWorkspace />} />
        <Route path="/flow" element={<Flow />} />
        <Route path="/flow/:pid" element={<Flow />} />
      </Routes>

      <button className="gear-fab" onClick={() => setOpen(true)} title="模型设置">
        <span className="gear-ico">⚙️</span>
        <span className="gear-model">{cfg.model}</span>
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} onLoggedOut={() => setReady(false)} />}
    </>
  )
}
