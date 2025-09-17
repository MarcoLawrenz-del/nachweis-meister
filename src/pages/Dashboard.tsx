import { Link } from "react-router-dom";
import { Folder, Settings, Upload } from "lucide-react";

function NavCard({ to, title, desc, Icon }: { 
  to: string; 
  title: string; 
  desc: string; 
  Icon: any 
}) {
  return (
    <div className="relative rounded-2xl border p-6 hover:shadow-lg transition cursor-pointer">
      <Link to={to} className="absolute inset-0" aria-label={title} />
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 text-primary" />
        <div>
          <div className="font-semibold text-lg">{title}</div>
          <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen bei subfix</p>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <NavCard 
          to="/app/subcontractors" 
          title="Nachunternehmer" 
          desc="Verwalten & einladen" 
          Icon={Folder} 
        />
        <NavCard 
          to="/app/einstellungen" 
          title="Einstellungen" 
          desc="Profil & Organisation" 
          Icon={Settings} 
        />
        <NavCard 
          to="/upload" 
          title="Upload (Demo)" 
          desc="Subunternehmer-Upload testen" 
          Icon={Upload} 
        />
      </div>
    </div>
  );
}