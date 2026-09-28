"use client";
import { useState } from "react";
import { updateTelegramChatId } from "@/actions/inventoryActions";
import { useSession } from "next-auth/react";
import { FiMessageCircle, FiCheck } from "react-icons/fi";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [chatId, setChatId] = useState(session?.user?.telegramChatId || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const result = await updateTelegramChatId(chatId);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      await update(); // Refresh session to reflect new telegramChatId
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-black mb-1">Profil</h1>
        <p className="text-gray-500">Kelola informasi akun dan notifikasi</p>
      </div>

      <div className="max-w-md space-y-6">
        {/* Account Info */}
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Akun</h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-400">Nama</p>
              <p className="text-black">{session?.user?.name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-black">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Telegram Settings */}
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <FiMessageCircle size={16} className="text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Telegram</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Atur Chat ID Telegram untuk menerima notifikasi kadaluarsa harian.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">Cara mendapatkan Chat ID:</p>
            <p>1. Cari bot <span className="font-mono bg-gray-200 px-1 rounded">@userinfobot</span> di Telegram</p>
            <p>2. Kirim pesan apapun ke bot tersebut</p>
            <p>3. Salin angka <strong>Id</strong> yang diberikan</p>
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              <FiCheck size={16} />
              Chat ID berhasil disimpan!
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="Contoh: 123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
