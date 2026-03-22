import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

function AppContent() {
  const scrollToAdmin = () => {
    document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onAdminClick={scrollToAdmin} />
      <main className="flex-1 pt-16">
        <Hero />
        <SubmissionForm />
        <AdminDashboard />
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
