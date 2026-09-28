/**
 * Web app manifest — makes the tracker installable to the phone home screen.
 *
 * `standalone` drops the browser chrome so it opens like a native app, which
 * matters mid-workout when the URL bar would otherwise eat vertical space.
 */
export default function manifest() {
  return {
    name: "Latihan — Fitness & Body Tracker",
    short_name: "Latihan",
    description: "Log workouts, track body metrics, and keep your streak.",
    start_url: "/log",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#ffffff",
    lang: "id",
    dir: "ltr",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Separate maskable asset: its mark is inset so launchers that crop to a
      // circle or squircle do not clip the dumbbell.
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Log Workout", url: "/log" },
      { name: "Body Metrics", url: "/body" },
      { name: "Progress", url: "/summary" },
    ],
  };
}
