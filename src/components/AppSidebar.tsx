import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  Users,
  FileCheck,
  Settings,
  FolderOpen,
  Shield,
  LogOut,
  Bell
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
import { Logo } from "@/components/Brand/Logo";

const mainItems = [
  { title: "Dashboard", url: "/app/dashboard", icon: BarChart3, testId: "nav-dashboard" },
  { title: "Beauftragte Firmen", url: "/app/subcontractors", icon: Users, testId: "nav-firmen" },
  { title: "Prüfen", url: "/app/review", icon: FileCheck, testId: "nav-pruefen" },
  { title: "Erinnerungen", url: "/app/reminders", icon: Bell, testId: "nav-erinnerungen" },
];

const settingsItems = [
  { title: "Rollen & Zugriffe", url: "/app/roles-access", icon: Shield, testId: "nav-rollen" },
  { title: "Einstellungen", url: "/app/settings", icon: Settings, testId: "nav-einstellungen" },
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
            <Logo width={100} height={30} />
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
                      data-testid={item.testId}
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
                      data-testid={item.testId}
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