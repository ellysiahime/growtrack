"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { HomeIcon, AcademicCapIcon, ChartBarIcon, BookOpenIcon, CalendarDaysIcon, ArrowRightStartOnRectangleIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image';

const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

export default function Sidebar() {
  const [isOwner, setIsOwner] = useState(false);
  const [open, setOpen] = useState(false);
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
    { name: "Timetable", href: "/timetable", icon: CalendarDaysIcon },
  ];

  // Hamburger button for mobile
  const Hamburger = (
    <button
      className="lg:hidden fixed top-4 left-4 z-50 bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full shadow-lg"
      onClick={() => setOpen(true)}
      aria-label="Open menu"
    >
      <Bars3Icon className="w-7 h-7" />
    </button>
  );

  // Sidebar content
  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b-2 border-pink-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/growtrack_logo.png" alt="GrowTrack Logo" width={36} height={36} className="inline-block align-middle" />
          <span className="text-2xl font-extrabold text-pink-600 tracking-wide">GrowTrack</span>
        </div>
        {/* Close button for mobile */}
        <button
          className="lg:hidden absolute top-4 right-4 text-pink-600 hover:text-pink-800"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>
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
                  onClick={() => setOpen(false)}
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
  );

  return (
    <>
      {/* Hamburger for mobile */}
      {Hamburger}
      {/* Sidebar overlay for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-200 ${open ? "block" : "hidden"} lg:hidden`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      {/* Sidebar itself */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl border-r-2 border-pink-100 z-50 transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:block`}
        style={{ willChange: 'transform' }}
      >
        {SidebarContent}
      </aside>
    </>
  );
} 