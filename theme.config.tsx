import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: (
    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "24px" }}>🔍</span>
      <span style={{ fontWeight: "bold" }}>Observa</span>
      <span style={{ color: "#666", fontSize: "14px" }}>Docs</span>
    </span>
  ),
  project: {
    link: "https://github.com/NikushaDevashvili/observa-api",
  },
  chat: {
    link: "https://github.com/NikushaDevashvili/observa-api/discussions",
  },
  docsRepositoryBase: "https://github.com/NikushaDevashvili/observa-api/tree/main/docs",
  footer: {
    text: "Observa Documentation © 2025",
  },
  primaryHue: 270, // Purple theme
  primarySaturation: 100,
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  search: {
    placeholder: "Search documentation...",
  },
  editLink: {
    text: "Edit this page on GitHub →",
  },
  feedback: {
    content: "Question? Give us feedback →",
    labels: "feedback",
  },
  toc: {
    backToTop: true,
  },
};

export default config;




