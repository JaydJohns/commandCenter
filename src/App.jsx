import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import DashboardView from "./views/DashboardView";
import ProjectsView from "./views/ProjectsView";
import KnowledgeView from "./views/KnowledgeView";
import SearchView from "./views/SearchView";
import SettingsView from "./views/SettingsView";
import InboxView from "./views/InboxView";
import DailyBriefingView from "./views/DailyBriefingView";
import TasksView from "./views/TasksView";
import WeeklyReviewView from "./views/WeeklyReviewView";
import GoogleView from "./views/GoogleView";
import { projects, settingsGroups } from "./data/mockData";

function App() {
  const navigate = useNavigate();
  const [captureValue, setCaptureValue] = useState("");

  return (
    <div className="shell">
      <Sidebar onTemplateClick={setCaptureValue} />

      <main className="main">
        <Topbar />

        <Routes>
          <Route
            path="/"
            element={
              <DashboardView
                captureValue={captureValue}
                onCaptureChange={setCaptureValue}
                onOpenProjects={() => navigate("/projects")}
                projects={projects}
              />
            }
          />
          <Route path="/projects" element={<ProjectsView />} />
          <Route path="/knowledge" element={<KnowledgeView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/settings" element={<SettingsView groups={settingsGroups} />} />
          <Route path="/inbox" element={<InboxView />} />
          <Route path="/tasks" element={<TasksView />} />
          <Route path="/briefing" element={<DailyBriefingView />} />
          <Route path="/review" element={<WeeklyReviewView />} />
          <Route path="/google" element={<GoogleView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
