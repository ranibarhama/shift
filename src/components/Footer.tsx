export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-line/60 bg-bg/95 px-6 py-2.5 text-center text-[11px] leading-relaxed text-muted backdrop-blur">
      <div className="flex items-center justify-center gap-1.5">
        <HeartIcon />
        <span>Built with passion and curiosity by the B2C</span>
      </div>
      <div className="mt-0.5">
        Any questions, suggestions or feedback — please contact{" "}
        <a
          href="mailto:Rani.barhama@similarweb.com"
          className="text-accent hover:underline"
        >
          Rani.barhama@similarweb.com
        </a>
      </div>
    </footer>
  );
}

function HeartIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="shrink-0 text-drop"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
