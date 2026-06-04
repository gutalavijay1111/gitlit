import { Link, useNavigate } from "react-router-dom";
import { GitBranch, Bell, LogOut, User, ChevronDown, Plus, Compass } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { getInitials, hashColor } from "../../lib/utils";

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Gitlit</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link to="/explore">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-7 gap-1.5">
                <Compass className="h-3.5 w-3.5" />Explore
              </Button>
            </Link>
            {user && (
              <Link to="/repos">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs h-7">
                  Repositories
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/repos/new")}
                title="New repository"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" title="Notifications">
                <Bell className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-accent transition-colors focus:outline-none">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={`${hashColor(user.username)} text-white text-[10px]`}>
                        {getInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground hidden sm:block">{user.username}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/repos" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Your repositories
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-xs">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="text-xs">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
