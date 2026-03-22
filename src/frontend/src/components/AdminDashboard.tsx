import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Globe,
  Instagram,
  Loader2,
  Trash2,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { SiSoundcloud, SiSpotify } from "react-icons/si";
import { toast } from "sonner";
import { SubmissionStatus, UserRole } from "../backend";
import type { Submission } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteSubmission,
  useGetAllSubmissions,
  useGetCallerRole,
  useUpdateSubmissionStatus,
} from "../hooks/useQueries";
import AudioPlayer from "./AudioPlayer";

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const classes: Record<SubmissionStatus, string> = {
    [SubmissionStatus.pending]: "status-pending",
    [SubmissionStatus.reviewed]: "status-reviewed",
    [SubmissionStatus.accepted]: "status-accepted",
    [SubmissionStatus.rejected]: "status-rejected",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function SubmissionRow({
  submission,
  index,
}: { submission: Submission; index: number }) {
  const updateStatus = useUpdateSubmissionStatus();
  const deleteSubmission = useDeleteSubmission();

  const handleStatusChange = async (value: string) => {
    try {
      await updateStatus.mutateAsync({
        id: submission.id,
        status: value as SubmissionStatus,
      });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubmission.mutateAsync(submission.id);
      toast.success("Submission deleted");
    } catch {
      toast.error("Failed to delete submission");
    }
  };

  const date = new Date(
    Number(submission.submittedAt / BigInt(1_000_000)),
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hasSocials = Object.values(submission.socialLinks).some(Boolean);

  const genreDisplay = submission.specificGenre
    ? `${submission.genre} / ${submission.specificGenre}`
    : submission.genre;

  return (
    <tr
      data-ocid={`admin.submission.item.${index}`}
      className={`border-b border-border transition-colors hover:bg-muted/40 ${
        index % 2 === 0 ? "bg-card" : "bg-muted/20"
      }`}
    >
      <td className="px-4 py-4">
        <div className="font-bold text-sm text-foreground">
          {submission.bandName}
        </div>
        {submission.website && (
          <a
            href={submission.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-teal mt-1"
          >
            <Globe className="w-3 h-3" /> website
          </a>
        )}
        {(submission.submitterName || submission.submitterRole) && (
          <div className="mt-1.5 text-xs text-muted-foreground/70 space-y-0.5">
            {submission.submitterName && <div>{submission.submitterName}</div>}
            {submission.submitterRole && (
              <div className="text-teal/70 font-medium">
                {submission.submitterRole}
              </div>
            )}
            {submission.submitterEmail && (
              <div className="truncate max-w-[160px]">
                {submission.submitterEmail}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
        {date}
      </td>
      <td className="px-4 py-4">
        <span className="text-xs font-semibold text-foreground/80">
          {genreDisplay}
        </span>
      </td>
      <td className="px-4 py-4">
        {submission.epkBlob ? (
          <a
            href={submission.epkBlob.getDirectURL()}
            download
            data-ocid={`admin.submission.epk.${index}`}
            className="flex items-center gap-1 text-xs text-teal hover:underline"
          >
            <Download className="w-3 h-3" /> EPK
          </a>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          {submission.socialLinks.instagram && (
            <a
              href={submission.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-teal transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {submission.socialLinks.spotify && (
            <a
              href={submission.socialLinks.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-teal transition-colors"
            >
              <SiSpotify className="w-4 h-4" />
            </a>
          )}
          {submission.socialLinks.soundcloud && (
            <a
              href={submission.socialLinks.soundcloud}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-teal transition-colors"
            >
              <SiSoundcloud className="w-4 h-4" />
            </a>
          )}
          {submission.socialLinks.youtube && (
            <a
              href={submission.socialLinks.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-teal transition-colors"
            >
              <Youtube className="w-4 h-4" />
            </a>
          )}
          {!hasSocials && (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-2">
          {submission.trackBlobs.length > 0 ? (
            submission.trackBlobs.map((blob, i) => (
              <div
                key={`track-${submission.id}-${i}`}
                className="flex items-center gap-2"
              >
                <AudioPlayer
                  src={blob.getDirectURL()}
                  label={`Track ${i + 1}`}
                />
                <a
                  href={blob.getDirectURL()}
                  download
                  data-ocid={`admin.submission.track_download.${index}`}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-teal border border-border hover:border-teal px-2 py-1 rounded transition-colors whitespace-nowrap"
                >
                  <Download className="w-3 h-3" />
                </a>
              </div>
            ))
          ) : (
            <span className="text-xs text-muted-foreground/50">No tracks</span>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <Select
          value={submission.status}
          onValueChange={handleStatusChange}
          disabled={updateStatus.isPending}
        >
          <SelectTrigger
            data-ocid={`admin.submission.status.${index}`}
            className="w-[130px] bg-secondary border-border text-xs h-8"
          >
            <SelectValue>
              <StatusBadge status={submission.status} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {Object.values(SubmissionStatus).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                <StatusBadge status={s} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              data-ocid={`admin.submission.delete_button.${index}`}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
              disabled={deleteSubmission.isPending}
            >
              {deleteSubmission.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent
            data-ocid="admin.delete.dialog"
            className="bg-card border-border"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">
                Delete Submission
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete the submission from{" "}
                <strong className="text-foreground">
                  {submission.bandName}
                </strong>
                ? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="admin.delete.cancel_button"
                className="bg-secondary border-border text-foreground hover:bg-muted"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                data-ocid="admin.delete.confirm_button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </td>
    </tr>
  );
}

export default function AdminDashboard() {
  const { identity, login, clear, loginStatus, isInitializing } =
    useInternetIdentity();
  const { data: role, isLoading: roleLoading } = useGetCallerRole();
  const {
    data: submissions,
    isLoading: subsLoading,
    error: subsError,
  } = useGetAllSubmissions();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isAdmin = role === UserRole.admin;
  const isLoggingIn = loginStatus === "logging-in";

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

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <section id="admin" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold tracking-[0.35em] text-teal uppercase">
            2. ADMIN DASHBOARD
          </span>
          <h2 className="text-4xl font-extrabold text-foreground uppercase tracking-tight mt-3 mb-3">
            SUBMISSION MANAGEMENT
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Review and manage all music submissions. (Password Protected)
          </p>
        </motion.div>

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
              Sign in with your admin credentials to view and manage
              submissions.
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

        {isAuthenticated && !roleLoading && !isAdmin && (
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
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
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

        {isAuthenticated && roleLoading && (
          <div
            data-ocid="admin.role.loading_state"
            className="flex justify-center py-20"
          >
            <Loader2 className="w-8 h-8 animate-spin text-teal" />
          </div>
        )}

        {isAuthenticated && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                All Submissions
                {submissions && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({submissions.length})
                  </span>
                )}
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

            <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
              {subsLoading ? (
                <div
                  data-ocid="admin.submissions.loading_state"
                  className="flex justify-center py-20"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-teal" />
                </div>
              ) : subsError ? (
                <div
                  data-ocid="admin.submissions.error_state"
                  className="py-20 text-center text-destructive"
                >
                  Failed to load submissions. Please refresh.
                </div>
              ) : !submissions || submissions.length === 0 ? (
                <div
                  data-ocid="admin.submissions.empty_state"
                  className="py-20 text-center"
                >
                  <p className="text-muted-foreground">No submissions yet.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Submissions will appear here once artists submit their
                    music.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table
                    className="w-full text-sm"
                    data-ocid="admin.submissions.table"
                  >
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        {[
                          "Band Name",
                          "Date",
                          "Genre",
                          "EPK",
                          "Socials",
                          "Audio Tracks",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-bold text-foreground/80 uppercase tracking-widest whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub, i) => (
                        <SubmissionRow
                          key={sub.id}
                          submission={sub}
                          index={i + 1}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
