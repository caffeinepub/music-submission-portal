import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Radio } from "lucide-react";
import { useState } from "react";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerRole } from "../hooks/useQueries";

interface HeaderProps {
  onAdminClick: () => void;
  onHomeClick: () => void;
  onSubmissionsClick: () => void;
  currentPage: "home" | "submissions" | "admin";
}

export default function Header({
  onAdminClick,
  onHomeClick,
  onSubmissionsClick,
  currentPage,
}: HeaderProps) {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { data: role } = useGetCallerRole();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const [copied, setCopied] = useState(false);

  const isAdmin = isAuthenticated && role === UserRole.admin;

  const isLoggingIn = loginStatus === "logging-in";

  const principalFull = identity?.getPrincipal().toString() ?? "";
  const principalShort = principalFull
    ? `${principalFull.slice(0, 8)}...${principalFull.slice(-4)}`
    : "";

  const handleCopyPrincipal = async () => {
    if (!principalFull) return;
    await navigator.clipboard.writeText(principalFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        login();
      } catch (err: any) {
        if (err?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleNavClick = (item: string) => {
    if (item === "HOME") {
      onHomeClick();
    } else if (item === "SUBMISSIONS") {
      onSubmissionsClick();
    } else {
      onHomeClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={onHomeClick}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <Radio className="w-6 h-6 text-teal" />
          </div>
          <span className="font-extrabold text-sm tracking-widest text-foreground uppercase">
            Indie City <span className="text-teal">Radio</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {["HOME", "LISTEN LIVE", "SUBMISSIONS", "ABOUT", "CONTACT"].map(
            (item) => {
              const isActive =
                (item === "HOME" && currentPage === "home") ||
                (item === "SUBMISSIONS" && currentPage === "submissions");
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  data-ocid={`nav.${item.toLowerCase().replace(" ", "_")}.link`}
                  className={`text-xs font-semibold tracking-widest transition-colors hover:text-teal ${
                    isActive ? "text-teal" : "text-foreground/80"
                  }`}
                >
                  {item}
                </button>
              );
            },
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={currentPage === "admin" ? onHomeClick : onAdminClick}
              data-ocid="header.admin_dashboard.button"
              className={`hidden sm:block text-xs font-semibold tracking-widest transition-colors ${
                currentPage === "admin"
                  ? "text-teal"
                  : "text-foreground/70 hover:text-teal"
              }`}
            >
              {currentPage === "admin" ? "← HOME" : "DASHBOARD"}
            </button>
          )}
          <div className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={handleAuthClick}
              disabled={isLoggingIn || isInitializing}
              data-ocid="header.admin_login.button"
              className="px-4 py-2 text-xs font-bold tracking-widest uppercase border border-teal text-teal rounded-full hover:bg-teal hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Logging in...
                </>
              ) : isAuthenticated ? (
                "LOGOUT"
              ) : (
                "LOGIN"
              )}
            </button>
            {isAuthenticated && principalShort && (
              <button
                type="button"
                onClick={handleCopyPrincipal}
                data-ocid="header.principal.button"
                title="Click to copy your full principal"
                className="text-[10px] font-mono text-foreground/40 hover:text-foreground/70 transition-colors leading-tight"
              >
                {copied ? "Copied!" : principalShort}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
