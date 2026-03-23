import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
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

type Page = "home" | "admin";

function AppContent() {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        onAdminClick={() => setPage("admin")}
        onHomeClick={() => setPage("home")}
        currentPage={page}
      />
      <main className="flex-1 pt-16">
        {page === "home" ? (
          <>
            <Hero />
            <SubmissionForm />
          </>
        ) : (
          <AdminDashboard />
        )}
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
