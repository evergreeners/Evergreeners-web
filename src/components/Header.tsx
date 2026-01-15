import { Settings, Bell, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const navigate = useNavigate();
  const [notifications] = useState(3);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass-nav mx-4 mt-4 rounded-2xl">
        <div className="container flex items-center justify-between py-3 px-4">
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={logo} 
              alt="Evergreeners" 
              className="w-8 h-8 object-contain transition-transform group-hover:scale-110" 
            />
            <span className="font-semibold text-foreground hidden sm:block">Forever Green</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button 
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 relative"
              onClick={() => navigate('/profile')}
            >
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-slow">
                  {notifications}
                </span>
              )}
            </button>
            
            {/* Settings - desktop */}
            <button 
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hidden sm:flex"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
            
            {/* Profile Avatar */}
            <Link 
              to="/profile"
              className="ml-2 w-8 h-8 rounded-full bg-secondary border border-border overflow-hidden hover:border-primary transition-colors"
            >
              <img
                src="https://avatars.githubusercontent.com/u/1?v=4"
                alt="User"
                className="w-full h-full object-cover"
              />
            </Link>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="sm:hidden">
                <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 ml-1">
                  <Menu className="w-4 h-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background border-border">
                <nav className="flex flex-col gap-4 mt-8">
                  <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  <Link to="/leaderboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                    <span className="text-lg">🏆</span>
                    <span>Leaderboard</span>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
