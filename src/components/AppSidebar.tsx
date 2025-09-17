import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  Settings,
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
import { Button } from "@/components/ui/button";
import { BRAND } from "@/config/brand";
import { Logo } from "@/components/Brand/Logo";
import { ROUTES } from "@/lib/ROUTES";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuthContext } from "@/contexts/SupabaseAuthContext";

const mainItems = [
  { title: "Dashboard", url: ROUTES.dashboard, icon: BarChart3, testId: "nav-dashboard" },
  { title: "Nachunternehmer", url: ROUTES.contractors, icon: Users, testId: "nav-firmen" },
  { title: "Einstellungen", url: ROUTES.settings, icon: Settings, testId: "nav-einstellungen" },
];

const settingsItems: any[] = [];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useSupabaseAuthContext();
  const currentPath = location.pathname;

  // Check if we're in demo mode
  const isDemo = currentPath.startsWith('/demo');
  const baseUrl = isDemo ? '/demo' : '/app';

  // Adjust URLs based on demo mode
  const adjustedMainItems = mainItems.map(item => ({
    ...item,
    url: item.url.replace('/app', baseUrl)
  }));

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const getNavCls = (active: boolean) =>
    active ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-accent hover:text-accent-foreground";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/auth', { replace: true });
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button 
                    variant="ghost" 
                    onClick={handleSignOut}
                    className="justify-start w-full h-auto p-2 font-normal"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Abmelden</span>
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