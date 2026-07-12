import { type ReactNode } from "react";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  const isFullHeight =
    (pathname.startsWith("/problems/") && pathname !== "/problems") ||
    pathname.startsWith("/contest/");
  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Navbar />
      <main
        className={
          isFullHeight
            ? "pt-[var(--nav-height)]"
            : "pt-[var(--nav-height)] max-w-5xl mx-auto px-6 py-8"
        }
      >
        {children}
      </main>
    </div>
  );
}
