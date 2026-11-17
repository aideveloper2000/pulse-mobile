import { useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { usePlayer } from '../store/player';
import { getPlayableUrl } from '../lib/playable';
import { useAuthUser } from '../lib/useAuth';
import { recordPlay } from '../lib/api';

/**
 * Owns the single audio player behind the player store: loads sources,
 * drives play/pause, reports progress, advances the queue, records plays.
 * Renders nothing.
 */
export function PlayerEngine() {
  const user = useAuthUser();
  const userId = user?.id ?? null;
  const currentId = usePlayer((s) => s.queue[s.order[s.index]]?.id ?? null);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const seekTick = usePlayer((s) => s.seekTick);
  const repeat = usePlayer((s) => s.repeat);
  const playerRef = useRef<AudioPlayer | null>(null);
  const recordedFor = useRef<number | null>(null);

  useEffect(() => {
    const player = createAudioPlayer(null, { updateInterval: 250 });
    playerRef.current = player;

    const sub = player.addListener('playbackStatusUpdate', (status) => {
      const state = usePlayer.getState();
      state.setProgress(
        status.currentTime * 1000,
        status.duration > 0 ? status.duration * 1000 : undefined,
      );
      if (status.didJustFinish) state.next(true);
    });

    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(() => {});

    return () => {
      sub.remove();
      player.remove();
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (!currentId) {
      player.pause();
      return;
    }
    const track = usePlayer.getState().queue.find((t) => t.id === currentId);
    if (!track) return;

    let cancelled = false;
    void getPlayableUrl(track)
      .then((url) => {
        if (cancelled) return;
        const state = usePlayer.getState();
        player.replace({ uri: url });
        void player.seekTo(0);
        player.volume = state.volume;
        player.muted = state.muted;
        player.loop = state.repeat === 'one';
        if (state.isPlaying) player.play();
      })
      .catch(() => {
        usePlayer.setState({ isPlaying: false });
      });

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentId) return;
    if (isPlaying) player.play();
    else player.pause();
  }, [isPlaying, currentId]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.loop = repeat === 'one';
  }, [repeat]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !seekTick || !currentId) return;
    const target = usePlayer.getState().progressMs / 1000;
    if (Math.abs(player.currentTime - target) > 0.25) {
      void player.seekTo(target);
    }
  }, [seekTick, currentId]);

  useEffect(() => {
    if (!userId || !currentId) {
      recordedFor.current = null;
      return;
    }
    if (recordedFor.current === currentId) return;
    recordedFor.current = currentId;
    void recordPlay(userId, currentId);
  }, [userId, currentId]);

  return null;
}
