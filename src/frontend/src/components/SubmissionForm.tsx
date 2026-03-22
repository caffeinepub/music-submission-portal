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
  Youtube,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { SiSoundcloud, SiSpotify } from "react-icons/si";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";

const TRACK_LABELS = ["Track 1", "Track 2", "Track 3"];

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

export default function SubmissionForm() {
  const { actor } = useActor();
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
  const [trackFiles, setTrackFiles] = useState<(File | null)[]>([
    null,
    null,
    null,
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([0, 0, 0, 0]);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    bandName?: string;
    genre?: string;
    submitterName?: string;
    submitterEmail?: string;
    submitterRole?: string;
  }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!bandName.trim()) errs.bandName = "Band/Artist name is required.";
    if (!genre) errs.genre = "Genre is required.";
    if (!submitterName.trim()) errs.submitterName = "Your name is required.";
    if (!submitterEmail.trim()) errs.submitterEmail = "Your email is required.";
    if (!submitterRole) errs.submitterRole = "Role is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleTrackFile = (idx: number, file: File | null) => {
    setTrackFiles((prev) => {
      const next = [...prev];
      next[idx] = file;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!actor) {
      toast.error("Not connected to backend. Please wait.");
      return;
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
        if (f) {
          const bytes = new Uint8Array(await f.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
            (pct) => {
              setUploadProgress((prev) => {
                const n = [...prev];
                n[i + 1] = pct;
                return n;
              });
            },
          );
          trackBlobs.push(blob);
        }
      }

      const socialLinks = {
        instagram: instagram || undefined,
        spotify: spotify || undefined,
        soundcloud: soundcloud || undefined,
        youtube: youtube || undefined,
      };

      await actor.submitBand(
        bandName,
        genre,
        specificGenre || null,
        website || null,
        submitterName || null,
        submitterEmail || null,
        submitterRole || null,
        socialLinks,
        epkBlob,
        trackBlobs,
      );
      setSuccess(true);
      toast.success("Submission received! We'll be in touch.");
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
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
    setTrackFiles([null, null, null]);
  };

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
              Thanks for submitting to Frequency FM. Our team will review your
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
              {errors.bandName && (
                <p
                  data-ocid="submission.band_name.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.bandName}
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
              {errors.genre && (
                <p
                  data-ocid="submission.genre.error_state"
                  className="text-xs text-destructive"
                >
                  {errors.genre}
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
            <Label className="text-sm font-semibold tracking-wide block mb-3">
              Social Media Links
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram URL"
                  data-ocid="submission.instagram.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <SiSpotify className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={spotify}
                  onChange={(e) => setSpotify(e.target.value)}
                  placeholder="Spotify URL"
                  data-ocid="submission.spotify.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <SiSoundcloud className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={soundcloud}
                  onChange={(e) => setSoundcloud(e.target.value)}
                  placeholder="SoundCloud URL"
                  data-ocid="submission.soundcloud.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="YouTube URL"
                  data-ocid="submission.youtube.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* EPK Upload */}
          <div className="mb-6">
            <Label className="text-sm font-semibold tracking-wide block mb-3">
              EPK (Electronic Press Kit)
            </Label>
            <div className="flex items-center gap-4">
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

          {/* Music Tracks */}
          <div className="mb-8">
            <Label className="text-sm font-semibold tracking-wide block mb-3">
              Music Tracks (up to 3)
            </Label>

            {/* Submitter Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-secondary/50 rounded-xl border border-border">
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
                {errors.submitterName && (
                  <p
                    data-ocid="submission.submitter_name.error_state"
                    className="text-xs text-destructive"
                  >
                    {errors.submitterName}
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
                  type="email"
                  value={submitterEmail}
                  onChange={(e) => setSubmitterEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-ocid="submission.submitter_email.input"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary h-9 text-sm"
                />
                {errors.submitterEmail && (
                  <p
                    data-ocid="submission.submitter_email.error_state"
                    className="text-xs text-destructive"
                  >
                    {errors.submitterEmail}
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
                {errors.submitterRole && (
                  <p
                    data-ocid="submission.submitter_role.error_state"
                    className="text-xs text-destructive"
                  >
                    {errors.submitterRole}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TRACK_LABELS.map((trackLabel, idx) => (
                <div key={trackLabel} className="space-y-2">
                  <label
                    htmlFor={`track-${idx}`}
                    data-ocid={`submission.track_${idx + 1}.upload_button`}
                    className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-teal text-primary-foreground font-bold text-xs tracking-wide uppercase rounded-full shadow-teal hover:opacity-90 transition-opacity w-full"
                  >
                    <Music className="w-3.5 h-3.5" />
                    {trackLabel}
                    {idx === 0 ? " *" : ""}
                  </label>
                  <input
                    id={`track-${idx}`}
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/mp3,.mp3,.wav"
                    className="hidden"
                    onChange={(e) =>
                      handleTrackFile(idx, e.target.files?.[0] ?? null)
                    }
                  />
                  {trackFiles[idx] ? (
                    <p className="text-xs text-teal truncate text-center">
                      {trackFiles[idx]!.name}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">
                      MP3 / WAV, max 50MB
                    </p>
                  )}
                  {isSubmitting &&
                    uploadProgress[idx + 1] > 0 &&
                    uploadProgress[idx + 1] < 100 && (
                      <div className="h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal transition-all"
                          style={{ width: `${uploadProgress[idx + 1]}%` }}
                        />
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center">
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
          </div>
        </motion.form>
      </div>
    </section>
  );
}
