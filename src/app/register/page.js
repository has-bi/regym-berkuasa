"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { registerUser } from "@/actions/inventoryActions";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      setLoading(false);
      return;
    }

    const result = await registerUser(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg border border-gray-200 w-full max-w-sm shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <Image src="/images/Logo.png" alt="Logo" width={28} height={28} className="object-contain" />
          <h1 className="text-xl font-light text-black">BarangXLupa</h1>
        </div>

        <h2 className="text-2xl font-light text-black mb-1">Daftar</h2>
        <p className="text-sm text-gray-500 mb-6">Buat akun untuk mulai memantau kulkasmu</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nama</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Nama kamu"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="kamu@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="Min. 6 karakter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Konfirmasi Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Ulangi password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Memuat..." : "Daftar"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-black underline underline-offset-2">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
