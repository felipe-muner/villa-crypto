import { promises as fs } from "fs";
import path from "path";
import { Villa } from "@/lib/types/villa";

const DATA_FILE = path.join(process.cwd(), "data", "villas.json");

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

export async function getVillas(): Promise<Villa[]> {
  await ensureDataFile();
  const data = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

export async function getVillaById(id: string): Promise<Villa | null> {
  const villas = await getVillas();
  return villas.find((v) => v.id === id) || null;
}

export async function addVilla(
  villa: Omit<Villa, "id" | "createdAt" | "updatedAt">
): Promise<Villa> {
  const villas = await getVillas();

  const newVilla: Villa = {
    ...villa,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  villas.push(newVilla);
  await fs.writeFile(DATA_FILE, JSON.stringify(villas, null, 2));

  return newVilla;
}

export async function updateVilla(
  id: string,
  updates: Partial<Omit<Villa, "id" | "createdAt">>
): Promise<Villa | null> {
  const villas = await getVillas();
  const index = villas.findIndex((v) => v.id === id);

  if (index === -1) return null;

  villas[index] = {
    ...villas[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(DATA_FILE, JSON.stringify(villas, null, 2));

  return villas[index];
}

export async function deleteVilla(id: string): Promise<boolean> {
  const villas = await getVillas();
  const index = villas.findIndex((v) => v.id === id);

  if (index === -1) return false;

  villas.splice(index, 1);
  await fs.writeFile(DATA_FILE, JSON.stringify(villas, null, 2));

  return true;
}
