import { useState, useEffect } from 'react';
import { getVolume, setVolume } from '../lib/soundEffects';

const PREV_VOLUME_KEY = 'chess-review-prev-volume';

function loadPrevVolume(): number {
  try {
    const stored = localStorage.getItem(PREV_VOLUME_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // localStorage may not be available
  }
  return 0.7;
}

export function SoundToggle() {
  const [isMuted, setIsMuted] = useState(() => getVolume() === 0);
  const [prevVolume, setPrevVolume] = useState(loadPrevVolume);

  useEffect(() => {
    setIsMuted(getVolume() === 0);
  }, []);

  const toggleMute = () => {
    if (isMuted) {
      const restoreVolume = prevVolume > 0 ? prevVolume : 0.7;
      setVolume(restoreVolume);
      setIsMuted(false);
    } else {
      const currentVol = getVolume();
      setPrevVolume(currentVol);
      try {
        localStorage.setItem(PREV_VOLUME_KEY, currentVol.toString());
      } catch {
        // localStorage may not be available
      }
      setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <button
      className="sound-toggle-btn"
      onClick={toggleMute}
      title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {isMuted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
