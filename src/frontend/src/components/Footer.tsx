import { Radio } from "lucide-react";
import { SiInstagram, SiSpotify, SiX, SiYoutube } from "react-icons/si";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`;

  const socialLinks = [
    { icon: SiInstagram, label: "Instagram", href: "https://instagram.com" },
    { icon: SiSpotify, label: "Spotify", href: "https://spotify.com" },
    { icon: SiX, label: "X", href: "https://x.com" },
    { icon: SiYoutube, label: "YouTube", href: "https://youtube.com" },
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-teal" />
            <span className="font-extrabold text-sm tracking-widest text-foreground uppercase">
              Indie <span className="text-teal">City</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {["Listen Live", "About Us", "Privacy Policy", "Contact"].map(
              (link) => (
                <a
                  key={link}
                  href="#home"
                  className="text-xs text-muted-foreground hover:text-teal transition-colors tracking-wide"
                >
                  {link}
                </a>
              ),
            )}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-teal transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-border py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground/60">
            © {year} Indie City. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Built with ♥ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-teal transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
