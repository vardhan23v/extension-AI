import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Filter Store ───────────────────────────────────────────
interface SalaryFilters {
  company: string;
  role: string;
  level: string;
  location: string;
  minExperience: number;
  maxExperience: number;
  minComp: number;
  maxComp: number;
  currency: 'INR' | 'USD' | 'GBP' | 'EUR';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FilterStore {
  filters: SalaryFilters;
  setFilter: <K extends keyof SalaryFilters>(key: K, value: SalaryFilters[K]) => void;
  resetFilters: () => void;
  savedFilters: { name: string; filters: SalaryFilters }[];
  saveFilter: (name: string) => void;
  loadFilter: (name: string) => void;
  deleteSavedFilter: (name: string) => void;
}

const defaultFilters: SalaryFilters = {
  company: '',
  role: '',
  level: '',
  location: '',
  minExperience: 0,
  maxExperience: 50,
  minComp: 0,
  maxComp: 0,
  currency: 'INR',
  sortBy: 'totalCompensation',
  sortOrder: 'desc',
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      filters: { ...defaultFilters },
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),
      savedFilters: [],
      saveFilter: (name) =>
        set((state) => ({
          savedFilters: [
            ...state.savedFilters.filter((f) => f.name !== name),
            { name, filters: { ...state.filters } },
          ],
        })),
      loadFilter: (name) => {
        const saved = get().savedFilters.find((f) => f.name === name);
        if (saved) set({ filters: { ...saved.filters } });
      },
      deleteSavedFilter: (name) =>
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.name !== name),
        })),
    }),
    { name: 'talentdash-filters' }
  )
);

// ─── Compare Store ──────────────────────────────────────────
interface CompareStore {
  companyA: string;
  companyB: string;
  setCompanyA: (slug: string) => void;
  setCompanyB: (slug: string) => void;
  swap: () => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
  companyA: '',
  companyB: '',
  setCompanyA: (slug) => set({ companyA: slug }),
  setCompanyB: (slug) => set({ companyB: slug }),
  swap: () =>
    set((state) => ({
      companyA: state.companyB,
      companyB: state.companyA,
    })),
  clear: () => set({ companyA: '', companyB: '' }),
}));

// ─── UI Store ───────────────────────────────────────────────
interface UIStore {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  closeMobileMenu: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
