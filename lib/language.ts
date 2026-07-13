export type SiteLang = "zh" | "en";

export function persistLanguage(lang: SiteLang) {
  window.localStorage.setItem("dx3xb_lang", lang);
  document.cookie = `dx3xb_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
}
