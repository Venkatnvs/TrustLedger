import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/components/UserProfile";
import { 
  Shield, 
  Menu, 
  X, 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Search, 
  Building2,
  LogIn,
  UserPlus,
  LogOut,
  Settings
} from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { currentRole, getRoleConfig } = useRole();
  const { logout, isAuthenticated, user, isLoading } = useAuth();
  const { toast } = useToast();

  // Debug logging
  console.log('Header render - isAuthenticated:', isAuthenticated, 'user:', user, 'isLoading:', isLoading);

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Projects", href: "/projects", icon: Building2 },
    { name: "Fund Flows", href: "/fund-flows", icon: TrendingUp },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Search", href: "/search", icon: Search },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">TrustLedger</span>
            </Link>
            
            {/* Role Badge */}
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {getRoleConfig(currentRole).label}
            </Badge>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.first_name || user?.username || 'User'}
                  </span>
                  <UserProfile />
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" data-testid="button-register">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4" data-testid="mobile-menu">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setIsMenuOpen(false)}
                      data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t">
                <div className="flex flex-col space-y-2">
                  {isLoading ? (
                    <div className="flex items-center space-x-2 px-2 py-1">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : isAuthenticated ? (
                    <>
                      <Link href="/settings">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                      <div className="flex items-center space-x-2 px-2 py-1">
                        <UserProfile />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user?.first_name || user?.username || 'User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => {
                          toast({
                            title: "Logged out successfully",
                            description: "You have been logged out of your account.",
                          });
                          logout();
                          setIsMenuOpen(false);
                        }}
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start"
                          onClick={() => setIsMenuOpen(false)}
                          data-testid="mobile-button-login"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button 
                          variant="default" 
                          className="w-full justify-start"
                          onClick={() => setIsMenuOpen(false)}
                          data-testid="mobile-button-register"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Register
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
