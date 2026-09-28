"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, inventoryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// --- Auth Actions ---

export async function registerUser(formData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  if (!email || !password || !name) {
    return { error: "Semua field harus diisi." };
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return { error: "Email sudah terdaftar." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
  });

  redirect("/login");
}

export async function updateTelegramChatId(chatId) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db
    .update(users)
    .set({ telegramChatId: chatId || null })
    .where(eq(users.id, session.user.id));

  revalidatePath("/profile");
  return { success: true };
}

// --- Inventory Actions ---

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getItems() {
  const userId = await getUserId();
  const rows = await db.select().from(inventoryItems).where(eq(inventoryItems.userId, userId));
  // Map camelCase Drizzle fields back to snake_case for component compatibility
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    nama: row.nama,
    kategori: row.kategori,
    jumlah: row.jumlah,
    satuan: row.satuan,
    tanggal_kadaluarsa: row.tanggalKadaluarsa
      ? new Date(row.tanggalKadaluarsa).toISOString().split("T")[0]
      : null,
  }));
}

export async function addItem(itemData) {
  const userId = await getUserId();
  const result = await db
    .insert(inventoryItems)
    .values({
      userId,
      nama: itemData.nama,
      kategori: itemData.kategori,
      jumlah: Number(itemData.jumlah),
      satuan: itemData.satuan,
      tanggalKadaluarsa: itemData.tanggal_kadaluarsa
        ? new Date(itemData.tanggal_kadaluarsa)
        : null,
    })
    .returning();
  revalidatePath("/");
  return result[0];
}

export async function updateItem(id, itemData) {
  const userId = await getUserId();
  const result = await db
    .update(inventoryItems)
    .set({
      nama: itemData.nama,
      kategori: itemData.kategori,
      jumlah: Number(itemData.jumlah),
      satuan: itemData.satuan,
      tanggalKadaluarsa: itemData.tanggal_kadaluarsa
        ? new Date(itemData.tanggal_kadaluarsa)
        : null,
      updatedAt: new Date(),
    })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
    .returning();
  revalidatePath("/");
  return result[0];
}

export async function deleteItem(id) {
  const userId = await getUserId();
  await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)));
  revalidatePath("/");
}
