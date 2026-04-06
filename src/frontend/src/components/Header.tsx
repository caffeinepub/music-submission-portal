import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Menu, Radio, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = isAuthenticated && role === UserRole.admin;

  const isLoggingIn = loginStatus === "logging-in";

  const principalFull = identity?.getPrincipal().toString() ?? "";
  const principalShort = principalFull
    ? `${principalFull.slice(0, 8)}...${principalFull.slice(-4)}`
    : "";

  // Re-fetch role immediately after login
  useEffect(() => {
    if (isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: ["callerRole"] });
    }
  }, [isAuthenticated, queryClient]);

  const handleCopyPrincipal = async () => {
    if (!principalFull) return;
    await navigator.clipboard.writeText(principalFull);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAuthClick = async () => {
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
    if (item === "HOME") {
      onHomeClick();
    } else if (item === "SUBMISSIONS") {
      onSubmissionsClick();
    } else {
      onHomeClick();
    }
  };

  const handleAdminClick = () => {
    setIsMenuOpen(false);
    if (currentPage === "admin") {
      onHomeClick();
    } else {
      onAdminClick();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
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

        {/* Desktop nav — hidden below lg */}
        <nav className="hidden lg:flex items-center gap-8">
          {["HOME", "LISTEN LIVE", "SUBMISSIONS", "ABOUT", "CONTACT"].map(
            (item) => {
              const isActive =
                (item === "HOME" && currentPage === "home") ||
                (item === "SUBMISSIONS" && currentPage === "submissions");

              if (item === "LISTEN LIVE") {
                return (
                  <a
                    key={item}
                    href="https://indiecity-radio-gjq.caffeine.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="nav.listen_live.link"
                    className="text-xs font-semibold tracking-widest transition-colors hover:text-teal text-foreground/80"
                  >
                    {item}
                  </a>
                );
              }

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

        {/* Right side: dashboard + auth (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          {/* Dashboard link — desktop only */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleAdminClick}
              data-ocid="header.admin_dashboard.button"
              className={`hidden lg:block text-xs font-semibold tracking-widest transition-colors ${
                currentPage === "admin"
                  ? "text-teal"
                  : "text-foreground/70 hover:text-teal"
              }`}
            >
              {currentPage === "admin" ? "\u2190 HOME" : "DASHBOARD"}
            </button>
          )}

          {/* Auth button + principal — desktop only */}
          <div className="hidden lg:flex flex-col items-center gap-0.5">
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

          {/* Hamburger button — mobile/tablet only (below lg) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            data-ocid="header.hamburger.button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden p-2 text-foreground/80 hover:text-teal transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {isMenuOpen && (
        <div
          data-ocid="header.mobile_menu.panel"
          className="lg:hidden bg-background/95 backdrop-blur-sm border-b border-border"
        >
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">
            {/* Nav links */}
            {["HOME", "LISTEN LIVE", "SUBMISSIONS", "ABOUT", "CONTACT"].map(
              (item) => {
                const isActive =
                  (item === "HOME" && currentPage === "home") ||
                  (item === "SUBMISSIONS" && currentPage === "submissions");

                if (item === "LISTEN LIVE") {
                  return (
                    <a
                      key={item}
                      href="https://indiecity-radio-gjq.caffeine.xyz/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                      data-ocid="mobile_nav.listen_live.link"
                      className="text-xs font-semibold tracking-widest py-3 border-b border-border/40 transition-colors hover:text-teal text-foreground/80"
                    >
                      {item}
                    </a>
                  );
                }

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleNavClick(item)}
                    data-ocid={`mobile_nav.${item.toLowerCase().replace(" ", "_")}.link`}
                    className={`text-xs font-semibold tracking-widest py-3 border-b border-border/40 text-left transition-colors hover:text-teal ${
                      isActive ? "text-teal" : "text-foreground/80"
                    }`}
                  >
                    {item}
                  </button>
                );
              },
            )}

            {/* Dashboard link (admin only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleAdminClick}
                data-ocid="mobile_nav.admin_dashboard.button"
                className={`text-xs font-semibold tracking-widest py-3 border-b border-border/40 text-left transition-colors ${
                  currentPage === "admin"
                    ? "text-teal"
                    : "text-foreground/70 hover:text-teal"
                }`}
              >
                {currentPage === "admin" ? "\u2190 HOME" : "DASHBOARD"}
              </button>
            )}

            {/* Auth button */}
            <div className="pt-3 pb-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAuthClick}
                disabled={isLoggingIn || isInitializing}
                data-ocid="mobile_nav.login.button"
                className="w-full px-4 py-2 text-xs font-bold tracking-widest uppercase border border-teal text-teal rounded-full hover:bg-teal hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                  data-ocid="mobile_nav.principal.button"
                  title="Click to copy your full principal"
                  className="text-[10px] font-mono text-foreground/40 hover:text-foreground/70 transition-colors text-center"
                >
                  {copied ? "Copied!" : principalShort}
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
