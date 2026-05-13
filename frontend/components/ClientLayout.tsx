"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg text-gray-100"
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 p-4 md:p-8 overflow-auto pt-16 md:pt-8">
        {children}
      </main>
    </div>
  );
}
