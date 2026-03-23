import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Instagram,
  Loader2,
  Music,
  Upload,
  X,
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { SiSoundcloud, SiSpotify } from "react-icons/si";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { createActorWithConfig } from "../config";
import { useActor } from "../hooks/useActor";

const GENRE_OPTIONS = [
  "Rock",
  "Metal",
  "Punk",
  "Alternative",
  "Pop",
  "Electronic",
  "Hip-Hop/Rap",
  "Other",
];

const ROLE_OPTIONS = [
  "Artist",
  "Band Member",
  "Manager",
  "Promoter",
  "Label Owner",
];

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isValidInstagram = (url: string): boolean =>
  !url.trim() || /instagram\.com/i.test(url.trim());

const isValidSoundcloud = (url: string): boolean =>
  !url.trim() || /soundcloud\.com/i.test(url.trim());

const isValidSpotify = (url: string): boolean =>
  !url.trim() || /spotify\.com/i.test(url.trim());

const isValidYoutube = (url: string): boolean =>
  !url.trim() || /(youtube\.com|youtu\.be)/i.test(url.trim());

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function SubmissionForm() {
  const { actor, isFetching } = useActor();
  const [bandName, setBandName] = useState("");
  const [genre, setGenre] = useState("");
  const [specificGenre, setSpecificGenre] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [youtube, setYoutube] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [submitterRole, setSubmitterRole] = useState("");
  const [epkFile, setEpkFile] = useState<File | null>(null);
  const [trackFiles, setTrackFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const trackInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([0, 0, 0, 0]);
  const [success, setSuccess] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getValidationErrors = (): string[] => {
    const errs: string[] = [];
    if (!submitterName.trim()) errs.push("Your Name is required.");
    if (!submitterEmail.trim()) errs.push("Your Email is required.");
    else if (!isValidEmail(submitterEmail))
      errs.push("Your Email must be a valid email address.");
    if (!submitterRole) errs.push("Role / Position is required.");
    if (!bandName.trim()) errs.push("Band / Artist Name is required.");
    if (!genre) errs.push("Genre is required.");
    const noSocialLink =
      !instagram.trim() &&
      !spotify.trim() &&
      !soundcloud.trim() &&
      !youtube.trim();
    if (noSocialLink) errs.push("At least one Social Media Link is required.");
    else {
      if (instagram.trim() && !isValidInstagram(normalizeUrl(instagram)))
        errs.push("Instagram URL must be a valid instagram.com link.");
      if (soundcloud.trim() && !isValidSoundcloud(normalizeUrl(soundcloud)))
        errs.push("SoundCloud URL must be a valid soundcloud.com link.");
      if (spotify.trim() && !isValidSpotify(normalizeUrl(spotify)))
        errs.push("Spotify URL must be a valid spotify.com link.");
      if (youtube.trim() && !isValidYoutube(normalizeUrl(youtube)))
        errs.push("YouTube URL must be a valid youtube.com or youtu.be link.");
    }
    if (trackFiles.length === 0)
      errs.push("At least one Music Track is required.");
    if (!disclaimerChecked) errs.push("You must agree to the disclaimer.");
    return errs;
  };

  const addTrackFiles = (files: FileList | null) => {
    if (!files) return;
    const audio = Array.from(files).filter(
      (f) => f.type.startsWith("audio/") || f.name.match(/\.(mp3|wav)$/i),
    );
    setTrackFiles((prev) => {
      const combined = [...prev, ...audio];
      return combined.slice(0, 3);
    });
  };

  const removeTrack = (idx: number) => {
    setTrackFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addTrackFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const errs = getValidationErrors();
    setValidationErrors(errs);
    if (errs.length > 0) return;

    // Resolve actor: use cached hook actor, or create a fresh one as fallback
    let resolvedActor = actor;
    if (!resolvedActor) {
      try {
        resolvedActor = await createActorWithConfig();
      } catch (fallbackErr) {
        console.error("Fallback actor creation failed:", fallbackErr);
        toast.error(
          isFetching
            ? "Still connecting to the backend — please try again in a moment."
            : "Not connected to backend. Please refresh the page and try again.",
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let epkBlob: ExternalBlob | null = null;
      if (epkFile) {
        const bytes = new Uint8Array(await epkFile.arrayBuffer());
        epkBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress((prev) => {
            const n = [...prev];
            n[0] = pct;
            return n;
          });
        });
      }

      const trackBlobs: ExternalBlob[] = [];
      for (let i = 0; i < trackFiles.length; i++) {
        const f = trackFiles[i];
        const bytes = new Uint8Array(await f.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress((prev) => {
            const n = [...prev];
            n[i + 1] = pct;
            return n;
          });
        });
        trackBlobs.push(blob);
      }

      const normalizedInstagram = normalizeUrl(instagram);
      const normalizedSpotify = normalizeUrl(spotify);
      const normalizedSoundcloud = normalizeUrl(soundcloud);
      const normalizedYoutube = normalizeUrl(youtube);

      const socialLinks = {
        instagram: normalizedInstagram || undefined,
        spotify: normalizedSpotify || undefined,
        soundcloud: normalizedSoundcloud || undefined,
        youtube: normalizedYoutube || undefined,
      };

      await (resolvedActor as any).submitBand(
        bandName.trim(),
        genre,
        specificGenre.trim() || null,
        website.trim() || null,
        submitterName.trim() || null,
        submitterEmail.trim() || null,
        submitterRole.trim() || null,
        socialLinks,
        epkBlob,
        trackBlobs,
        epkFile ? epkFile.name : null,
        trackFiles.map((f) => f.name),
      );
      setSuccess(true);
      toast.success("Submission received! We'll be in touch.");
    } catch (err: any) {
      console.error("Submission error:", err);
      const msg: string = err?.message || "";
      if (/size|too large/i.test(msg)) {
        toast.error("File too large. Please keep tracks under 50MB each.");
      } else if (/timeout|timed out/i.test(msg)) {
        toast.error(
          "Upload timed out. Try smaller files or a faster connection.",
        );
      } else {
        toast.error(
          `Submission failed: ${
            msg || "Unknown error. Check console for details."
          }`,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setBandName("");
    setGenre("");
    setSpecificGenre("");
    setWebsite("");
    setInstagram("");
    setSpotify("");
    setSoundcloud("");
    setYoutube("");
    setSubmitterName("");
    setSubmitterEmail("");
    setSubmitterRole("");
    setEpkFile(null);
    setTrackFiles([]);
    setDisclaimerChecked(false);
    setSubmitAttempted(false);
    setValidationErrors([]);
  };

  const noSocialLink =
    !instagram.trim() &&
    !spotify.trim() &&
    !soundcloud.trim() &&
    !youtube.trim();

  if (success) {
    return (
      <section id="submit" className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            data-ocid="submission.success_state"
            className="bg-card rounded-2xl p-12 shadow-card border border-border"
          >
            <CheckCircle2 className="w-16 h-16 text-teal mx-auto mb-6" />
            <h2 className="text-3xl font-extrabold text-foreground uppercase tracking-wide mb-4">
              Submission Received!
            </h2>
            <p className="text-muted-foreground mb-8">
              Thanks for submitting to Indie City. Our team will review your
              music and get back to you soon.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-8 py-3 bg-teal text-primary-foreground font-bold tracking-widest text-sm uppercase rounded-full shadow-teal hover:opacity-90 transition-opacity"
            >
              SUBMIT ANOTHER
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="submit" className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold tracking-[0.35em] text-teal uppercase">
            1. PUBLIC SUBMISSION FORM
          </span>
          <h2 className="text-4xl font-extrabold text-foreground uppercase tracking-tight mt-3 mb-3">
            ARTIST MUSIC SUBMISSION
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Send us your latest sounds and we'll give them a proper listen. All
            genres welcome.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          onSubmit={handleSubmit}
          data-ocid="submission.form"
          className="bg-card rounded-2xl p-8 sm:p-10 shadow-card border border-border"
        >
          {/* Your Information */}
          <div className="mb-8">
            <Label className="text-sm font-semibold tracking-wide block mb-3">
              Your Information
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-xl border border-border">
              <div className="space-y-2">
                <Label
                  htmlFor="submitterName"
                  className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Your Name <span className="text-teal">*</span>
                </Label>
                <Input
                  id="submitterName"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="Full name"
                  data-ocid="submission.submitter_name.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-9 text-sm"
                />
                {submitAttempted && !submitterName.trim() && (
                  <p className="text-xs text-destructive mt-1">
                    Your Name is required.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="submitterEmail"
                  className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                >
                  Your Email <span className="text-teal">*</span>
                </Label>
                <Input
                  id="submitterEmail"
                  type="text"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-ocid="submission.submitter_email.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-9 text-sm"
                />
                {submitAttempted && !submitterEmail.trim() && (
                  <p className="text-xs text-destructive mt-1">
                    Your Email is required.
                  </p>
                )}
                {submitAttempted &&
                  submitterEmail.trim() &&
                  !isValidEmail(submitterEmail) && (
                    <p className="text-xs text-destructive mt-1">
                      Please enter a valid email address.
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Role / Position <span className="text-teal">*</span>
                </Label>
                <Select value={submitterRole} onValueChange={setSubmitterRole}>
                  <SelectTrigger
                    data-ocid="submission.submitter_role.select"
                    className="bg-secondary border-border text-foreground h-9 text-sm"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r} className="text-sm">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {submitAttempted && !submitterRole && (
                  <p className="text-xs text-destructive mt-1">
                    Role / Position is required.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Row 1: Band Name + Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label
                htmlFor="bandName"
                className="text-sm font-semibold tracking-wide"
              >
                Band / Artist Name <span className="text-teal">*</span>
              </Label>
              <Input
                id="bandName"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                placeholder="The Static Waves"
                data-ocid="submission.band_name.input"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
              />
              {submitAttempted && !bandName.trim() && (
                <p className="text-xs text-destructive mt-1">
                  Band / Artist Name is required.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="website"
                className="text-sm font-semibold tracking-wide"
              >
                Website URL
              </Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourband.com"
                data-ocid="submission.website.input"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Row 2: Genre + Specific Genre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold tracking-wide">
                Genre <span className="text-teal">*</span>
              </Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger
                  data-ocid="submission.genre.select"
                  className="bg-secondary border-border text-foreground focus:ring-primary"
                >
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {GENRE_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g} className="text-sm">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {submitAttempted && !genre && (
                <p className="text-xs text-destructive mt-1">
                  Genre is required.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="specificGenre"
                className="text-sm font-semibold tracking-wide"
              >
                Specific Genre
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="specificGenre"
                value={specificGenre}
                onChange={(e) => setSpecificGenre(e.target.value)}
                placeholder="e.g. Indie Rock, Doom Metal..."
                data-ocid="submission.specific_genre.input"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="mb-6">
            <Label className="text-sm font-semibold tracking-wide block mb-1">
              Social Media Links <span className="text-teal">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              At least one is required.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/yourband"
                    data-ocid="submission.instagram.input"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                  />
                </div>
                {submitAttempted &&
                  instagram.trim() &&
                  !isValidInstagram(normalizeUrl(instagram)) && (
                    <p className="text-xs text-destructive mt-1 ml-6">
                      Must be a valid instagram.com URL.
                    </p>
                  )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SiSpotify className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={spotify}
                    onChange={(e) => setSpotify(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                    data-ocid="submission.spotify.input"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                  />
                </div>
                {submitAttempted &&
                  spotify.trim() &&
                  !isValidSpotify(normalizeUrl(spotify)) && (
                    <p className="text-xs text-destructive mt-1 ml-6">
                      Must be a valid spotify.com URL.
                    </p>
                  )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SiSoundcloud className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={soundcloud}
                    onChange={(e) => setSoundcloud(e.target.value)}
                    placeholder="https://soundcloud.com/yourband"
                    data-ocid="submission.soundcloud.input"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                  />
                </div>
                {submitAttempted &&
                  soundcloud.trim() &&
                  !isValidSoundcloud(normalizeUrl(soundcloud)) && (
                    <p className="text-xs text-destructive mt-1 ml-6">
                      Must be a valid soundcloud.com URL.
                    </p>
                  )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@yourband"
                    data-ocid="submission.youtube.input"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                  />
                </div>
                {submitAttempted &&
                  youtube.trim() &&
                  !isValidYoutube(normalizeUrl(youtube)) && (
                    <p className="text-xs text-destructive mt-1 ml-6">
                      Must be a valid youtube.com or youtu.be URL.
                    </p>
                  )}
              </div>
            </div>
            {submitAttempted && noSocialLink && (
              <p className="text-xs text-destructive mt-2">
                At least one social media link is required.
              </p>
            )}
          </div>

          {/* EPK Upload */}
          <div className="mb-6">
            <Label className="text-sm font-semibold tracking-wide block mb-1">
              EPK (Electronic Press Kit)
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <label
                htmlFor="epk-upload"
                data-ocid="submission.epk.upload_button"
                className="cursor-pointer flex items-center gap-2 px-5 py-3 bg-teal text-primary-foreground font-bold text-xs tracking-widest uppercase rounded-full shadow-teal hover:opacity-90 transition-opacity"
              >
                <Upload className="w-3.5 h-3.5" />
                UPLOAD EPK (PDF)
              </label>
              <input
                id="epk-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => setEpkFile(e.target.files?.[0] ?? null)}
              />
              {epkFile ? (
                <span className="text-xs text-teal truncate max-w-[200px]">
                  {epkFile.name}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  PDF only, max 20MB
                </span>
              )}
            </div>
            {isSubmitting &&
              uploadProgress[0] > 0 &&
              uploadProgress[0] < 100 && (
                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal transition-all"
                    style={{ width: `${uploadProgress[0]}%` }}
                  />
                </div>
              )}
          </div>

          {/* Music Tracks - single drag/drop box */}
          <div className="mb-8">
            <Label className="text-sm font-semibold tracking-wide block mb-1">
              Music Tracks <span className="text-teal">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Upload up to 3 tracks (MP3 or WAV, max 50MB each).
            </p>

            {/* Drop zone */}
            <label
              htmlFor="track-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              data-ocid="submission.tracks.dropzone"
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-teal bg-teal/10"
                  : "border-border bg-secondary/50 hover:border-teal/50"
              } ${trackFiles.length >= 3 ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
            >
              <Music className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {trackFiles.length >= 3
                    ? "Maximum 3 tracks reached"
                    : "Click or drag & drop audio files here"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {trackFiles.length}/3 tracks added
                </p>
              </div>
              <input
                ref={trackInputRef}
                id="track-upload"
                type="file"
                accept="audio/mpeg,audio/wav,audio/mp3,.mp3,.wav"
                multiple
                disabled={trackFiles.length >= 3}
                className="hidden"
                onChange={(e) => addTrackFiles(e.target.files)}
              />
            </label>

            {/* Track list */}
            {trackFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {trackFiles.map((f, idx) => (
                  <li
                    key={f.name}
                    className="flex items-center justify-between gap-3 px-4 py-2 bg-secondary rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Music className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                      <span className="text-xs text-foreground truncate">
                        {f.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isSubmitting &&
                        uploadProgress[idx + 1] > 0 &&
                        uploadProgress[idx + 1] < 100 && (
                          <div className="w-20 h-1 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal transition-all"
                              style={{ width: `${uploadProgress[idx + 1]}%` }}
                            />
                          </div>
                        )}
                      <button
                        type="button"
                        onClick={() => removeTrack(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove track"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {submitAttempted && trackFiles.length === 0 && (
              <p className="text-xs text-destructive mt-2">
                At least one music track is required.
              </p>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mb-6 p-4 bg-secondary/50 rounded-xl border border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerChecked}
                onChange={(e) => setDisclaimerChecked(e.target.checked)}
                data-ocid="submission.disclaimer.checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border accent-teal cursor-pointer"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                By submitting this form, I confirm that: (1) all music submitted
                was created by human artists and is not AI-generated; (2) I own
                the rights to this music or have obtained the necessary
                permissions to share it with Indie City; and (3) I understand
                that submission does not guarantee airplay on Indie City Radio.
              </span>
            </label>
            {submitAttempted && !disclaimerChecked && (
              <p className="text-xs text-destructive mt-2">
                You must agree to the disclaimer.
              </p>
            )}
          </div>

          {/* Submit button + validation errors */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              data-ocid="submission.submit.button"
              className="flex items-center gap-2 px-10 py-4 bg-teal text-primary-foreground font-bold tracking-widest text-sm uppercase rounded-full shadow-teal hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> SUBMITTING...
                </>
              ) : (
                "SUBMIT YOUR MUSIC"
              )}
            </button>

            {submitAttempted && validationErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                data-ocid="submission.validation_errors"
                className="w-full max-w-md bg-destructive/10 border border-destructive/30 rounded-xl p-4"
              >
                <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-2">
                  Please complete the following required fields:
                </p>
                <ul className="space-y-1">
                  {validationErrors.map((err) => (
                    <li
                      key={err}
                      className="text-xs text-destructive flex items-start gap-1.5"
                    >
                      <span className="mt-0.5 flex-shrink-0">&#8226;</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </motion.form>
      </div>
    </section>
  );
}
