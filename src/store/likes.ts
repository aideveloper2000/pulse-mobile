import { create } from 'zustand';
import { fetchLikedTrackIds, toggleLike as apiToggleLike } from '../lib/api';

interface LikesStore {
  ids: Set<number>;
  loadedFor: string | null;
  loading: boolean;
  load: (userId: string | null) => Promise<void>;
  has: (trackId: number) => boolean;
  toggle: (userId: string, trackId: number) => Promise<void>;
}

export const useLikes = create<LikesStore>((set, get) => ({
  ids: new Set<number>(),
  loadedFor: null,
  loading: false,

  load: async (userId) => {
    if (!userId) {
      set({ ids: new Set(), loadedFor: null });
      return;
    }
    if (get().loadedFor === userId || get().loading) return;
    set({ loading: true });
    try {
      const ids = await fetchLikedTrackIds(userId);
      set({ ids, loadedFor: userId });
    } catch {
      // keep whatever we had
    } finally {
      set({ loading: false });
    }
  },

  has: (trackId) => get().ids.has(trackId),

  toggle: async (userId, trackId) => {
    const before = get().ids.has(trackId);
    // optimistic
    set((s) => {
      const next = new Set(s.ids);
      if (before) next.delete(trackId);
      else next.add(trackId);
      return { ids: next };
    });
    try {
      await apiToggleLike(userId, trackId);
    } catch {
      // revert
      set((s) => {
        const next = new Set(s.ids);
        if (before) next.add(trackId);
        else next.delete(trackId);
        return { ids: next };
      });
    }
  },
}));
