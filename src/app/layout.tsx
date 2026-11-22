import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { getCurrentUser, getActiveSessions } from "@/lib/auth";
import { getAllHouses } from "@/lib/actions/house.actions";
import { getUniqueCategories } from "@/lib/actions/cashflow.actions";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { UserStoreProvider } from "@/components/providers/user-store-provider";
import type { HouseOption } from "@/types/settings.types";

export const metadata: Metadata = {
  title: "FinVault — Digital Cash Flow & Relative Loan Management",
  description:
    "Digital cash inflow and outflow manager across multiple properties with relative loan tracking and Excel analytics.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "80x80", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const [houses, activeSessions, inflowCategories, outflowCategories] = user
    ? await Promise.all([
        getAllHouses(),
        getActiveSessions(user.id),
        getUniqueCategories("INFLOW"),
        getUniqueCategories("OUTFLOW"),
      ])
    : [[], [], [], []];

  return (
    <html lang="en" className={`${GeistSans.variable} dark`}>
      <body className="bg-background text-white font-sans antialiased min-h-screen">
        {user ? (
          <UserStoreProvider
            user={{ id: user.id, email: user.email, name: user.name }}
            houses={houses.map((h: HouseOption) => ({
              id: h.id,
              name: h.name,
              initialCash: Number(h.initialCash),
            }))}
            activeSessionsCount={activeSessions.length}
          >
            <div className="flex min-h-screen">
              {/* Left Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col pl-64 min-w-0">
                <Header
                  inflowCategories={inflowCategories}
                  outflowCategories={outflowCategories}
                />
                <main className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto">
                  {children}
                </main>
              </div>
            </div>
          </UserStoreProvider>
        ) : (
          <div className="min-h-screen w-full">{children}</div>
        )}
      </body>
    </html>
  );
}
