"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function UserMenu({ user }) {
  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/profile"
        className="text-sm text-gray-500 hover:text-black transition-colors"
      >
        {user.name || user.email}
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs text-gray-400 hover:text-black transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400"
      >
        Keluar
      </button>
    </div>
  );
}
