import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Activity, 
  LogOut, 
  User,
  Menu,
  Stethoscope,
  LifeBuoy
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      href: "/",
      label: "Patients",
      icon: LayoutDashboard,
      active: location === "/",
    },
    {
      href: "/dashboard",
      label: "Activité",
      icon: Activity,
      active: location === "/dashboard",
    },
    {
      href: "/support",
      label: "Contacter Support",
      icon: LifeBuoy,
      active: location === "/support",
    },
  ];

  const displayName = user?.firstName && user?.lastName 
    ? `Dr. ${user.firstName} ${user.lastName}` 
    : user?.email || "Utilisateur";

  const NavContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight">ClinicFlow</h1>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tableau de Bord</p>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <span className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
              item.active 
                ? "bg-primary text-white shadow-lg shadow-primary/20 font-medium" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <User className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white" data-testid="text-user-name">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 truncate" data-testid="text-user-email">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30"
          onClick={() => logout()}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block w-64 shrink-0 fixed inset-y-0 left-0 border-r z-20">
        {NavContent}
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-md">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg">ClinicFlow</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 border-r-0">
            {NavContent}
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 md:ml-64 w-full pt-16 md:pt-0 min-h-screen bg-slate-50/50">
        {children}
      </main>
    </div>
  );
}
