import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Users,
  FileCheck,
  Settings,
  FolderOpen,
  Shield,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppAuth } from "@/hooks/useAppAuth";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";

const mainItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: BarChart3 },
  { title: "Rechtliche Compliance", url: "/app/compliance", icon: Shield },
  { title: "Projekte", url: "/app/projects", icon: FolderOpen },
  { title: "Nachunternehmer", url: "/app/subcontractors", icon: Users },
  { title: "Prüfungen", url: "/app/review", icon: FileCheck },
];

const settingsItems = [
  { title: "Einstellungen", url: "/app/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut } = useAppAuth();

  // Check if we're in demo mode
  const isDemo = currentPath.startsWith('/demo');
  const baseUrl = isDemo ? '/demo' : '/app';

  // Adjust URLs based on demo mode
  const adjustedMainItems = mainItems.map(item => ({
    ...item,
    url: item.url.replace('/app', baseUrl)
  }));

  const adjustedSettingsItems = settingsItems.map(item => ({
    ...item,
    url: item.url.replace('/app', baseUrl)
  }));

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const getNavCls = (active: boolean) =>
    active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground";

  const handleSignOut = async () => {
    if (!isDemo) {
      await signOut();
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{BRAND.name}</h2>
              <p className="text-xs text-muted-foreground">{BRAND.tagline}</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Hauptmenü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adjustedMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adjustedSettingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="justify-start w-full h-auto p-2 font-normal"
                    disabled={isDemo}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isDemo ? "Abmelden (Demo)" : "Abmelden"}</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}