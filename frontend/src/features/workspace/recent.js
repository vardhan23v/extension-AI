// Remembers the last opened project for the "Code Studio" shortcut (per browser only).
const KEY = 'extensio:lastProject';

export const lastProjectId = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const rememberProject = (id) => {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // storage unavailable
  }
};
