/**
 * Brand wordmark: one word "MiTanda" — "Mi" in Base Blue (primary), "Tanda" in
 * the normal foreground color. Rendered inside the header <h1>, which supplies
 * the text size/weight and foreground color, so "Tanda" inherits it.
 * On dark, blue text switches to Cerulean (accent) for contrast — matching the
 * rest of the app's blue-text-on-dark convention.
 */
export function Wordmark() {
  return (
    <span className="whitespace-nowrap">
      <span className="text-primary dark:text-accent">Mi</span>Tanda
    </span>
  );
}
