import '../styles/globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { ReportsProvider } from '../context/ReportsContext';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';

export const metadata = {
  title: 'SpotFix — Municipal Government Ops Console',
  description: 'Municipal issue triage, review, and resolution dashboard for civic authorities.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
        <ThemeProvider>
          <ReportsProvider>
            {/* Left Nav Sidebar */}
            <Sidebar />

            {/* Main Application Canvas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
              <TopHeader />
              <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
            </div>
          </ReportsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
