import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { FileUp, Puzzle, Palette, Play, LayoutDashboard, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardLogo from "@/assets/dashboard-logo.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Files", href: "/files", icon: FileUp },
  { name: "Integrations", href: "/integrations", icon: Puzzle },
  { name: "Branding", href: "/branding", icon: Palette },
  { name: "Pipeline", href: "/pipeline", icon: Play },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <img src={dashboardLogo} alt="RAG Chatbot Dashboard" className="h-10 w-auto" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
