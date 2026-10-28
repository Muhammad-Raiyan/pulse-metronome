import { useState, useEffect } from 'react';
import { Search, Music, Disc, User, Check, X } from 'lucide-react';

export function SongMapLoader({ onSelectSong }) {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState(null);

  useEffect(() => {
    // Construct base-aware path (handles '/' locally and '/pulse-metronome/' on GitHub Pages)
    const jsonUrl = `${import.meta.env.BASE_URL}songs.json`.replace(/([^:]\/)\/+/g, '$1');

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status} while fetching ${jsonUrl}`);
        }
        return res.json();
      })
      .then((data) => {
        setSongs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load songs.json:', err);
        setLoading(false);
      });
  }, []);

  const filteredSongs = songs.filter((song) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (song.title && song.title.toLowerCase().includes(q)) ||
      (song.artist && song.artist.toLowerCase().includes(q)) ||
      (song.album && song.album.toLowerCase().includes(q))
    );
  });

  const handleSelect = (song) => {
    setSelectedSongId(song.id);
    if (onSelectSong) {
      onSelectSong(song);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm">Song & Preset Loader</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-500">{songs.length} Tracks</span>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by song, artist, or album..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 py-4 text-center animate-pulse">Loading library...</p>
      ) : filteredSongs.length === 0 ? (
        <div className="p-4 text-center rounded-2xl bg-slate-950 border border-slate-800/60">
          <p className="text-xs text-slate-400 font-medium">No matching songs found</p>
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
          {filteredSongs.map((song) => {
            const isSelected = selectedSongId === song.id;

            return (
              <button
                key={song.id}
                onClick={() => handleSelect(song)}
                className={`w-full text-left p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 hover:bg-slate-800/70 border-slate-800/80'
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <p className="font-semibold text-xs text-slate-100 truncate flex items-center gap-1.5">
                    {song.title}
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-slate-500 shrink-0" />
                      {song.artist}
                    </span>
                    {song.album && (
                      <span className="flex items-center gap-1 truncate text-slate-500">
                        <Disc className="w-3 h-3 text-slate-600 shrink-0" />
                        {song.album}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-cyan-400 font-bold text-xs">
                    {song.bpm} <span className="text-[10px] text-slate-500 font-normal">BPM</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {song.beatsPerBar || 4}/4
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}