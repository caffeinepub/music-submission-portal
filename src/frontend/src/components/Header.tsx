import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Radio } from "lucide-react";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerRole } from "../hooks/useQueries";

// Hardcoded admin principal — must match access-control.mo
const ADMIN_PRINCIPAL =
  "mqpqn-qsle4-usj5i-uytxj-pzbwu-3ppcx-cqjq5-qtktf-nwxvx-szbij-bae";

interface HeaderProps {
  onAdminClick: () => void;
  onHomeClick: () => void;
  currentPage: "home" | "admin";
}

export default function Header({
  onAdminClick,
  onHomeClick,
  currentPage,
}: HeaderProps) {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { data: role } = useGetCallerRole();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  // Check admin via hardcoded principal (immediate, no backend round-trip)
  // also falls back to role query for belt-and-suspenders
  const principalStr = identity?.getPrincipal().toString();
  const isAdmin =
    (isAuthenticated && principalStr === ADMIN_PRINCIPAL) ||
    role === UserRole.admin;

  const isLoggingIn = loginStatus === "logging-in";

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

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["HOME", "LISTEN LIVE", "SUBMISSIONS", "ABOUT", "CONTACT"].map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onHomeClick();
                  if (item === "SUBMISSIONS") {
                    setTimeout(() => {
                      document
                        .getElementById("submit")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 50);
                  }
                }}
                data-ocid={`nav.${item.toLowerCase().replace(" ", "_")}.link`}
                className={`text-xs font-semibold tracking-widest transition-colors hover:text-teal ${
                  item === "SUBMISSIONS" && currentPage === "home"
                    ? "text-teal"
                    : "text-foreground/80"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </nav>

        {/* Auth button */}
        <div className="flex items-center gap-3">
          {isAuthenticated && isAdmin && (
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
              "ADMIN LOGIN"
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
