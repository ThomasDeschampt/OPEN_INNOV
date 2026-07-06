import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import { ToastProvider } from "./components/toast";
import Navigation from "./components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face — a technical grotesque that fits an informatics school and
// reads as intentional rather than the default system/Inter look.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: 'EPSI Connect - Application Étudiante',
  description: 'Application d\'intégration étudiante pour l\'EPSI - Découverte, Communication BDE, Événements et Communauté',
  keywords: 'EPSI, étudiant, BDE, événements, campus, intégration',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <ToastProvider>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1 pb-20 md:pb-8">
                {children}
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
