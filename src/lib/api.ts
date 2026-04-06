export const CONFIG = {
  SHEET_API_URL: process.env.NEXT_PUBLIC_SHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwY2NPLitV_Q8dVTz7cmOX17B5eSr8kgnNPpxmvkiFFbBKbnud33Yru9dmtWs_8iPKV/exec',
};

export interface Film {
  id: number;
  title: string;
  cast?: string;
  type: string;
  episodes: string | number | null;
  status: string;
  date: string | null;
  notes: string;
  link?: string;
  count?: number;
  rowIndex: number;
}

export async function loginAppScript(user: string, pass: string, isRegister = false) {
  const action = isRegister ? 'register' : 'login';
  const cleanUser = user.replace(/[^a-z0-9]/g, '_');
  const url = `${CONFIG.SHEET_API_URL}?action=${action}&user=${encodeURIComponent(cleanUser)}&pass=${encodeURIComponent(pass)}`;

  const response = await fetch(url, { method: 'POST', cache: 'no-store' });
  return await response.json();
}

export async function fetchFilmData(user: string, pass: string) {
  const url = `${CONFIG.SHEET_API_URL}?action=read&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`;
  const response = await fetch(url, { cache: 'no-store' });
  const result = await response.json();
  if (result.status === 'success') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.data.map((item: any) => ({
      id: parseInt(item.no),
      title: item.judul || '',
      cast: item.cast || '',
      type: item.type || '',
      episodes: item.episode || null,
      status: item.status || '',
      date: item.date || null,
      notes: item.notes || '',
      link: item.link || '',
      rowIndex: item.rowIndex
    }));
  }
  throw new Error(result.message || 'Failed to load data');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveFilmData(data: any, action: 'add' | 'edit', user: string, pass: string) {
  const sheetData = {
    no: data.id,
    judul: data.title,
    cast: data.cast || '',
    type: data.type,
    episode: data.episodes,
    status: data.status,
    date: data.date,
    notes: data.notes,
    link: data.link || '',
    rowIndex: data.rowIndex
  };

  const formData = new FormData();
  formData.append('data', JSON.stringify(sheetData));

  const url = `${CONFIG.SHEET_API_URL}?action=${action}&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`;
  const response = await fetch(url, { method: 'POST', body: formData });
  return await response.json();
}

export async function deleteFilmData(rowIndex: number, user: string, pass: string) {
  const formData = new FormData();
  formData.append('data', JSON.stringify({ rowIndex }));

  const url = `${CONFIG.SHEET_API_URL}?action=delete&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`;
  const response = await fetch(url, { method: 'POST', body: formData });
  return await response.json();
}

export async function updateUserProfile(user: string, pass: string, newUsername?: string, newPassword?: string, newAvatar?: string) {
  const data = {
    newUsername: newUsername || undefined,
    newPassword: newPassword || undefined,
    newAvatar: newAvatar !== undefined ? newAvatar : undefined
  };

  const formData = new FormData();
  formData.append('data', JSON.stringify(data));

  const cleanUser = user.replace(/[^a-z0-9]/g, '_');
  const url = `${CONFIG.SHEET_API_URL}?action=update_profile&user=${encodeURIComponent(cleanUser)}&pass=${encodeURIComponent(pass)}`;
  
  const response = await fetch(url, { method: 'POST', body: formData, cache: 'no-store' });
  return await response.json();
}
