import { useState, useEffect } from 'react';
import { getVolume, setVolume } from '../lib/soundEffects';

export function VolumeControl() {
  const [volume, setLocalVolume] = useState(() => getVolume());

  useEffect(() => {
    // Sync on mount
    setLocalVolume(getVolume());
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    setVolume(newVolume);
  };

  return (
    <div className="volume-control">
      <input
        type="range"
        className="volume-slider"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={handleVolumeChange}
        title={`Volume: ${Math.round(volume * 100)}%`}
        aria-label="Volume control"
      />
    </div>
  );
}
