"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { HomeIcon, AcademicCapIcon, ChartBarIcon, BookOpenIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";

const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

export default function Sidebar() {
  const [isOwner, setIsOwner] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === OWNER_UID);
    };
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const navItems = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Exam", href: "/exam", icon: AcademicCapIcon },
    { name: "Score", href: "/score", icon: ChartBarIcon },
    { name: "Subjects", href: "/subjects", icon: BookOpenIcon },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r-2 border-pink-100 z-40">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b-2 border-pink-100">
          <h1 className="text-2xl font-extrabold text-pink-600 text-center">
            🧠📊 GrowTrack
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-pink-500 text-white shadow-lg"
                        : "text-pink-700 hover:bg-pink-50"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button - Only show if owner is logged in */}
        {isOwner && (
          <div className="p-4 border-t-2 border-pink-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-semibold text-pink-700 hover:bg-pink-50 transition-all duration-200"
              title="Logout"
            >
              <ArrowRightStartOnRectangleIcon className="w-6 h-6" />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 