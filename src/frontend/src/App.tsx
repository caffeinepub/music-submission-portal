import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Hero from "./components/Hero";
import SubmissionForm from "./components/SubmissionForm";
import { InternetIdentityProvider } from "./hooks/useInternetIdentity";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

type Page = "home" | "submissions" | "admin";

function getInitialPage(): Page {
  const path = window.location.pathname;
  if (path === "/submit" || path === "/submissions") return "submissions";
  if (path === "/admin") return "admin";
  return "home";
}

function AppContent() {
  const [page, setPage] = useState<Page>(getInitialPage);

  const navigateTo = (newPage: Page) => {
    setPage(newPage);
    const path =
      newPage === "submissions"
        ? "/submit"
        : newPage === "admin"
          ? "/admin"
          : "/";
    window.history.pushState(null, "", path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setPage(getInitialPage());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onAdminClick={() => navigateTo("admin")}
        onHomeClick={() => navigateTo("home")}
        onSubmissionsClick={() => navigateTo("submissions")}
        currentPage={page}
      />
      <main className="flex-1 pt-16">
        {page === "home" && (
          <Hero onSubmissionsClick={() => navigateTo("submissions")} />
        )}
        {page === "submissions" && <SubmissionForm />}
        {page === "admin" && <AdminDashboard />}
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <InternetIdentityProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </InternetIdentityProvider>
  );
}
