import { motion } from "motion/react";

export default function Hero() {
  const scrollToSubmit = () => {
    document.getElementById("submit")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/assets/generated/hero-concert-crowd.dim_1600x700.jpg')",
          filter: "grayscale(100%)",
        }}
      />
      {/* Dark overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block text-xs font-bold tracking-[0.35em] text-teal uppercase mb-6">
            ◈ OPEN SUBMISSIONS ◈
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white uppercase tracking-tight leading-tight drop-shadow-2xl mb-4">
            GET HEARD ON
            <br />
            <span className="text-teal">FREQUENCY FM.</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-white/90 mb-8 drop-shadow-lg">
            Submit Your Music Today.
          </p>
          <p className="text-base text-white/60 max-w-lg mx-auto mb-10">
            We're always on the lookout for fresh sounds and emerging artists.
            Send us your tracks and let your music reach thousands of listeners.
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          onClick={scrollToSubmit}
          data-ocid="hero.submit_tracks.button"
          className="inline-flex items-center gap-2 px-8 py-4 bg-teal text-primary-foreground font-bold tracking-widest text-sm uppercase rounded-full shadow-teal hover:opacity-90 active:scale-95 transition-all"
        >
          SUBMIT YOUR TRACKS
        </motion.button>
      </div>
    </section>
  );
}
