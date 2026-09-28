"use client";
import { useRouter, usePathname } from "next/navigation";
import { FiLogOut } from "react-icons/fi";

export default function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <button
      onClick={handleLogout}
      aria-label="Log out"
      className="btn btn-ghost btn-md w-11 px-0"
    >
      <FiLogOut size={16} />
    </button>
  );
}
