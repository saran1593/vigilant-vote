const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const openProtectedFile = async (storedUrl: string) => {
  const name = storedUrl.split('/').pop();
  const win = window.open('', '_blank'); // opened first so the popup is not blocked
  try {
    const res = await fetch(`${API_BASE}/files/${name}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.message || 'Could not open file');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.open(url, '_blank');
  } catch (err: any) {
    win?.close();
    alert(err.message);
  }
};