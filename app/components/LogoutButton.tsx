"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const OWNER_UID = process.env.NEXT_PUBLIC_OWNER_UID;

export default function LogoutButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setShow(user?.id === OWNER_UID);
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

  if (!show) return null;
  return (
    <button
      onClick={handleLogout}
      className="fixed top-4 right-6 z-50 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-5 rounded-full shadow-lg transition-all duration-200"
      title="Logout"
    >
      Logout
    </button>
  );
} 