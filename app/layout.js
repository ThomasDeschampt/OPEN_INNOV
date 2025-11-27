import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata = {
  title: 'EPSI Connect - Application Étudiante',
  description: 'Application d\'intégration étudiante pour l\'EPSI - Découverte, Communication BDE, Événements et Communauté',
  keywords: 'EPSI, étudiant, BDE, événements, campus, intégration',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
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
