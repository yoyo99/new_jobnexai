import React from "react";
import { useTranslations } from "../i18n";

export function Header() {
  const { t, lang } = useTranslations();

  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">
              ⚡ JobNexAI
            </h1>
            <span className="ml-3 text-sm text-slate-400">
              {t("header.powered") || "Powered by AI"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-sm">
              {lang === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
