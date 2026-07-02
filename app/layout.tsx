import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "./theme/ThemeProvider";
import { Toaster } from "sonner";
import { getSiteProfile } from "@/lib/site-profile";
import "./globals.css";

const siteProfile = getSiteProfile();

export const metadata: Metadata = {
  title: siteProfile.adminTitle,
  description: siteProfile.adminDescription,
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <html lang="fr">
    <head>
      <link rel="stylesheet" href="https://use.typekit.net/mah7tat.css" />
    </head>
    <body>
      <AppRouterCacheProvider>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </AppRouterCacheProvider>
    </body>
  </html>
);

export default RootLayout;
