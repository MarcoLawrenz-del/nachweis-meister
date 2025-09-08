import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./Dashboard";
import Projects from "./Projects";
import ProjectDetail from "./ProjectDetail";
import Subcontractors from "./Subcontractors";
import SubcontractorDetail from "./SubcontractorDetail";
import ComplianceDashboard from "./ComplianceDashboard";
import { ReviewQueue } from "./ReviewQueue";
import RequirementsDetail from "./RequirementsDetail";
import { DocumentDetail } from "./DocumentDetail";
import Settings from "./Settings";
import { DemoAuthProvider } from "@/contexts/DemoContext";
import { Info } from "lucide-react";

export default function DemoApp() {
  return (
    <DemoAuthProvider>
      {/* Demo banner */}
      <div className="bg-blue-600 text-white p-2 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <Info className="h-4 w-4" />
          <span>DEMO MODUS - Alle Daten sind Beispieldaten | Demo Mode - All data is sample data</span>
        </div>
      </div>
      
      <Routes>
        <Route path="/*" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="compliance" element={<ComplianceDashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="subcontractors" element={<Subcontractors />} />
          <Route path="subcontractors/:id" element={<SubcontractorDetail />} />
          <Route path="requirements/:projectSubId" element={<RequirementsDetail />} />
          <Route path="documents/:documentId" element={<DocumentDetail />} />
          <Route path="review" element={<ReviewQueue />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </DemoAuthProvider>
  );
}