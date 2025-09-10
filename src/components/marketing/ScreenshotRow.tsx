import { ScreenshotCard } from "./ScreenshotCard";

export function ScreenshotRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ScreenshotCard 
        k="dashboard" 
        title="Dashboard Übersicht" 
        href="/demo" 
      />
      <ScreenshotCard 
        k="subProfile" 
        title="Nachunternehmer-Profil" 
        href="/demo" 
      />
      <ScreenshotCard 
        k="uploadMobile" 
        title="Mobile Upload" 
        href="/demo" 
      />
    </div>
  );
}