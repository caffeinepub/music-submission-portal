import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChevronDown,
  Download,
  Heart,
  Instagram,
  Loader2,
  Star,
  Youtube,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { SiSoundcloud, SiSpotify } from "react-icons/si";
import { toast } from "sonner";
import { SubmissionLabel, Tab } from "../backend";
import type { Submission as BaseSubmission } from "../backend";
type Submission = BaseSubmission & {
  epkFilename?: string;
  trackFilenames?: string[];
};
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useClaimAdmin,
  useGetSubmissionsByTab,
  useIsCallerAdmin,
  useLabelSubmission,
} from "../hooks/useQueries";
import AudioPlayer from "./AudioPlayer";

type SortKey = "date" | "genre";

// Fetch all four tab counts in parallel
function useTabCounts() {
  const new_ = useGetSubmissionsByTab(Tab.newSubmissions);
  const shortlisted = useGetSubmissionsByTab(Tab.shortlisted);
  const faved = useGetSubmissionsByTab(Tab.faved);
  const archived = useGetSubmissionsByTab(Tab.archived);
  return {
    [Tab.newSubmissions]: new_.data?.length ?? null,
    [Tab.shortlisted]: shortlisted.data?.length ?? null,
    [Tab.faved]: faved.data?.length ?? null,
    [Tab.archived]: archived.data?.length ?? null,
  };
}

function LabelBadges({ submission }: { submission: Submission }) {
  return (
    <div className="flex items-center gap-1.5">
      {submission.isShortlisted && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Star className="w-2.5 h-2.5" /> Shortlisted
        </span>
      )}
      {submission.isFaved && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-rose-500/20 text-rose-400 border border-rose-500/30">
          <Heart className="w-2.5 h-2.5" /> Faved
        </span>
      )}
      {submission.isArchived && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-muted/60 text-muted-foreground border border-border">
          <Archive className="w-2.5 h-2.5" /> Archived
        </span>
      )}
    </div>
  );
}

function SubmissionAccordionRow({
  submission,
  index,
  isOpen,
  onToggle,
}: {
  submission: Submission;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const labelMutation = useLabelSubmission();

  const date = new Date(
    Number(submission.submittedAt / BigInt(1_000_000)),
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const genreDisplay = submission.specificGenre
    ? `${submission.genre} / ${submission.specificGenre}`
    : submission.genre;

  const handleLabel = async (label: SubmissionLabel, currentValue: boolean) => {
    try {
      await labelMutation.mutateAsync({
        id: submission.id,
        label,
        value: !currentValue,
      });
      toast.success(
        !currentValue ? `Marked as ${label}` : `Removed from ${label}`,
      );
    } catch {
      toast.error("Failed to update label");
    }
  };

  return (
    <div
      data-ocid={`admin.submission.item.${index}`}
      className={`relative border-b border-border last:border-0 transition-colors ${
        isOpen ? "bg-muted/20" : "bg-transparent hover:bg-muted/10"
      }`}
    >
      {/* Teal left border accent when open */}
      {isOpen && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-teal rounded-l" />
      )}

      {/* Accordion Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors"
      >
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-teal" : ""
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`font-bold text-sm ${
                isOpen ? "text-teal" : "text-foreground"
              }`}
            >
              {submission.bandName}
            </span>
            <LabelBadges submission={submission} />
          </div>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0">
          <span className="text-xs text-muted-foreground hidden sm:block font-medium">
            {genreDisplay}
          </span>
          <span className="text-xs text-muted-foreground/50 hidden md:block whitespace-nowrap">
            {date}
          </span>
        </div>
      </button>

      {/* Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-7 pt-1 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border/50">
              {/* Left column */}
              <div className="space-y-5 pt-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal mb-2.5">
                    Submitter Info
                  </p>
                  <div className="space-y-1">
                    {submission.submitterName && (
                      <p className="text-sm text-foreground font-semibold">
                        {submission.submitterName}
                      </p>
                    )}
                    {submission.submitterRole && (
                      <p className="text-xs text-muted-foreground font-medium">
                        {submission.submitterRole}
                      </p>
                    )}
                    {submission.submitterEmail && (
                      <a
                        href={`mailto:${submission.submitterEmail}`}
                        className="text-xs text-muted-foreground hover:text-teal transition-colors"
                      >
                        {submission.submitterEmail}
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal mb-2.5">
                    Genre
                  </p>
                  <p className="text-sm text-foreground">{genreDisplay}</p>
                </div>

                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal mb-2.5">
                    Social Links
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {submission.socialLinks.instagram && (
                      <a
                        href={submission.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" /> Instagram
                      </a>
                    )}
                    {submission.socialLinks.spotify && (
                      <a
                        href={submission.socialLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal transition-colors"
                      >
                        <SiSpotify className="w-3.5 h-3.5" /> Spotify
                      </a>
                    )}
                    {submission.socialLinks.soundcloud && (
                      <a
                        href={submission.socialLinks.soundcloud}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal transition-colors"
                      >
                        <SiSoundcloud className="w-3.5 h-3.5" /> SoundCloud
                      </a>
                    )}
                    {submission.socialLinks.youtube && (
                      <a
                        href={submission.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-teal transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5" /> YouTube
                      </a>
                    )}
                    {!Object.values(submission.socialLinks).some(Boolean) && (
                      <span className="text-xs text-muted-foreground/40">
                        —
                      </span>
                    )}
                  </div>
                </div>

                {submission.epkBlob && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal mb-2.5">
                      EPK
                    </p>
                    <a
                      href={submission.epkBlob.getDirectURL()}
                      download
                      data-ocid={`admin.submission.epk.${index}`}
                      className="inline-flex items-center gap-1.5 text-xs text-teal hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {submission.epkFilename || "Download EPK"}
                    </a>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div className="space-y-5 pt-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal mb-2.5">
                    Audio Tracks
                  </p>
                  {submission.trackBlobs.length > 0 ? (
                    <div className="space-y-3">
                      {submission.trackBlobs.map((blob, i) => {
                        const url = blob.getDirectURL();
                        const filename =
                          submission.trackFilenames?.[i] || `Track ${i + 1}`;
                        return (
                          <div
                            key={`track-${submission.id}-${i}`}
                            className="flex items-center gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <AudioPlayer src={url} label={filename} />
                            </div>
                            <a
                              href={url}
                              download={filename}
                              data-ocid={`admin.submission.track_download.${index}`}
                              className="flex-shrink-0 flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-teal border border-border hover:border-teal rounded transition-colors"
                              title={`Download ${filename}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">
                      No tracks uploaded
                    </span>
                  )}
                </div>

                {/* Label Actions */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal mb-3">
                    Actions
                  </p>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Shortlist */}
                    <button
                      type="button"
                      onClick={() =>
                        handleLabel(
                          SubmissionLabel.shortlisted,
                          submission.isShortlisted,
                        )
                      }
                      disabled={labelMutation.isPending}
                      data-ocid={`admin.submission.shortlist.${index}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide border transition-all disabled:opacity-50 ${
                        submission.isShortlisted
                          ? "bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_12px_oklch(0.73_0.14_72_/_0.2)]"
                          : "bg-transparent text-muted-foreground border-border hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10"
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          submission.isShortlisted ? "fill-amber-400" : ""
                        }`}
                      />
                      Shortlist
                    </button>

                    {/* Fave */}
                    <button
                      type="button"
                      onClick={() =>
                        handleLabel(SubmissionLabel.faved, submission.isFaved)
                      }
                      disabled={labelMutation.isPending}
                      data-ocid={`admin.submission.fave.${index}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide border transition-all disabled:opacity-50 ${
                        submission.isFaved
                          ? "bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-[0_0_12px_oklch(0.54_0.17_27_/_0.2)]"
                          : "bg-transparent text-muted-foreground border-border hover:border-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10"
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          submission.isFaved ? "fill-rose-400" : ""
                        }`}
                      />
                      Fave
                    </button>

                    {/* Archive */}
                    <button
                      type="button"
                      onClick={() =>
                        handleLabel(
                          SubmissionLabel.archived,
                          submission.isArchived,
                        )
                      }
                      disabled={labelMutation.isPending}
                      data-ocid={`admin.submission.archive.${index}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold uppercase tracking-wide border transition-all disabled:opacity-50 ${
                        submission.isArchived
                          ? "bg-muted text-foreground border-border/60"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      {submission.isArchived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubmissionsTabContent({ tab }: { tab: Tab }) {
  const { data: submissions, isLoading } = useGetSubmissionsByTab(tab);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");

  const sorted = [...(submissions ?? [])].sort((a, b) => {
    if (sortKey === "genre") return a.genre.localeCompare(b.genre);
    return Number(b.submittedAt - a.submittedAt);
  });

  if (isLoading) {
    return (
      <div
        data-ocid="admin.submissions.loading_state"
        className="flex justify-center py-16"
      >
        <Loader2 className="w-5 h-5 animate-spin text-teal" />
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div
        data-ocid="admin.submissions.empty_state"
        className="py-14 text-center"
      >
        <p className="text-muted-foreground text-sm">No submissions here.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Controls */}
      <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-border bg-muted/5">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black mr-1">
          Sort by:
        </span>
        <button
          type="button"
          onClick={() => setSortKey("date")}
          data-ocid="admin.sort.date_tab"
          className={`text-[11px] font-bold px-3 py-1 rounded border transition-colors ${
            sortKey === "date"
              ? "bg-teal text-primary-foreground border-teal"
              : "text-muted-foreground border-border hover:border-teal hover:text-teal"
          }`}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setSortKey("genre")}
          data-ocid="admin.sort.genre_tab"
          className={`text-[11px] font-bold px-3 py-1 rounded border transition-colors ${
            sortKey === "genre"
              ? "bg-teal text-primary-foreground border-teal"
              : "text-muted-foreground border-border hover:border-teal hover:text-teal"
          }`}
        >
          Genre
        </button>
      </div>

      {/* Submission Rows */}
      {sorted.map((sub, i) => (
        <SubmissionAccordionRow
          key={sub.id}
          submission={sub}
          index={i + 1}
          isOpen={openId === sub.id}
          onToggle={() => setOpenId(openId === sub.id ? null : sub.id)}
        />
      ))}
    </div>
  );
}

const TABS = [
  { key: Tab.newSubmissions, label: "New Submissions" },
  { key: Tab.shortlisted, label: "Shortlisted" },
  { key: Tab.faved, label: "Faves" },
  { key: Tab.archived, label: "Archived" },
] as const;

export default function AdminDashboard() {
  const { identity, login, clear, loginStatus, isInitializing } =
    useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const {
    data: isAdmin,
    isLoading: adminCheckLoading,
    refetch: recheckAdmin,
  } = useIsCallerAdmin();
  const claimAdmin = useClaimAdmin();
  const tabCounts = useTabCounts();

  const [claimAttempted, setClaimAttempted] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.newSubmissions);

  // Auto-claim admin on first login
  useEffect(() => {
    if (!isAuthenticated || adminCheckLoading || claimAttempted) return;
    if (isAdmin) return;

    const tryClaim = async () => {
      setIsClaiming(true);
      setClaimAttempted(true);
      try {
        const principal = identity!.getPrincipal();
        await claimAdmin.mutateAsync(principal);
        await recheckAdmin();
      } catch {
        // Claim failed -- not first user
      } finally {
        setIsClaiming(false);
      }
    };

    tryClaim();
  }, [
    isAuthenticated,
    isAdmin,
    adminCheckLoading,
    claimAttempted,
    identity,
    claimAdmin,
    recheckAdmin,
  ]);

  const handleLogout = async () => {
    await clear();
    setClaimAttempted(false);
    setIsClaiming(false);
    queryClient.clear();
  };

  const handleLogin = () => {
    try {
      login();
    } catch (err: any) {
      if (err?.message === "User is already authenticated") {
        clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const showLoadingSpinner =
    isAuthenticated && (adminCheckLoading || isClaiming);
  const showAccessDenied =
    isAuthenticated &&
    !adminCheckLoading &&
    !isClaiming &&
    !isAdmin &&
    claimAttempted;
  const showDashboard = isAuthenticated && isAdmin;

  return (
    <section id="admin" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold tracking-[0.35em] text-teal uppercase">
            ADMIN DASHBOARD
          </span>
          <h2 className="text-4xl font-extrabold text-foreground uppercase tracking-tight mt-3 mb-3">
            SUBMISSION MANAGEMENT
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Review, sort, and manage all music submissions.
          </p>
        </motion.div>

        {/* Login Panel */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="admin.login.panel"
            className="bg-card rounded-2xl p-12 shadow-card border border-border text-center max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <svg
                role="img"
                aria-label="Lock"
                className="w-8 h-8 text-teal"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Lock</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Admin Access Required
            </h3>
            <p className="text-muted-foreground text-sm mb-8">
              Sign in with Internet Identity to access the dashboard.
            </p>
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoggingIn || isInitializing}
              data-ocid="admin.login.button"
              className="flex items-center gap-2 px-8 py-3 bg-teal text-primary-foreground font-bold tracking-widest text-sm uppercase rounded-full shadow-teal hover:opacity-90 transition-opacity disabled:opacity-50 mx-auto"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Logging in...
                </>
              ) : (
                "LOGIN TO ADMIN"
              )}
            </button>
          </motion.div>
        )}

        {/* Loading / Claiming spinner */}
        {showLoadingSpinner && (
          <div
            data-ocid="admin.role.loading_state"
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-teal" />
            <p className="text-muted-foreground text-sm">
              {isClaiming
                ? "Setting up admin access..."
                : "Verifying access..."}
            </p>
          </div>
        )}

        {/* Access Denied */}
        {showAccessDenied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-ocid="admin.access_denied.panel"
            className="bg-card rounded-2xl p-12 shadow-card border border-border text-center max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <svg
                role="img"
                aria-label="Access denied"
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Access denied</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Access Denied
            </h3>
            <p className="text-muted-foreground text-sm mb-8">
              Your account does not have admin privileges.
            </p>
            <button
              type="button"
              onClick={handleLogout}
              data-ocid="admin.logout.button"
              className="px-8 py-3 border border-border text-muted-foreground font-bold tracking-widest text-sm uppercase rounded-full hover:border-teal hover:text-teal transition-colors"
            >
              LOGOUT
            </button>
          </motion.div>
        )}

        {/* Dashboard */}
        {showDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Submissions
              </h3>
              <button
                type="button"
                onClick={handleLogout}
                data-ocid="admin.logout.button"
                className="text-xs font-semibold tracking-widest text-muted-foreground hover:text-teal uppercase transition-colors"
              >
                LOGOUT
              </button>
            </div>

            {/* Tab Navigation */}
            <div
              className="flex border-b-2 border-border"
              data-ocid="admin.tabs.panel"
            >
              {TABS.map(({ key, label }) => {
                const count = tabCounts[key];
                const isActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    data-ocid={`admin.${key}.tab`}
                    className={`relative px-4 py-3 text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-2 ${
                      isActive
                        ? "text-teal"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                    {count !== null && (
                      <span
                        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[9px] font-black transition-colors ${
                          isActive
                            ? "bg-teal text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-teal rounded-t" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content Card */}
            <div className="bg-card rounded-b-xl shadow-card border border-t-0 border-border overflow-hidden">
              <SubmissionsTabContent tab={activeTab} />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
