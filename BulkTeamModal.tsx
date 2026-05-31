import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Save, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Users, 
  Plus, 
  Trash, 
  UserPlus, 
  Settings,
  CaseSensitive,
  Minimize2,
  Maximize2,
  SortAsc,
  AlertTriangle
} from 'lucide-react';

interface SlotEntry {
  id: string;
  slotNumber: number;
  teamName: string;
  players?: string;
  logo?: string;
}

interface BulkTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: SlotEntry[];
  onUpdateSlots: (updatedSlots: SlotEntry[]) => void;
  isDarkMode: boolean;
  compressImage: (base64Str: string, maxWidth?: number, maxHeight?: number) => Promise<string>;
}

export const BulkTeamModal: React.FC<BulkTeamModalProps> = ({
  isOpen,
  onClose,
  slots,
  onUpdateSlots,
  isDarkMode,
  compressImage
}) => {
  // Local state for interactive editing before saving
  const [localSlots, setLocalSlots] = useState<SlotEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'named' | 'empty' | 'with-players'>('all');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Suffix/prefix inputs
  const [teamPrefix, setTeamPrefix] = useState('');
  const [teamSuffix, setTeamSuffix] = useState('');
  const [playerSuffix, setPlayerSuffix] = useState('');

  // Sync state with parent slots on open/change
  useEffect(() => {
    if (isOpen) {
      setLocalSlots(slots.map(s => ({ ...s })));
      setIsSaved(false);
    }
  }, [isOpen, slots]);

  // Find duplicate team names (case-insensitive, trimmed)
  const duplicateTeamNames = React.useMemo(() => {
    const counts: Record<string, number> = {};
    localSlots.forEach(s => {
      const name = s.teamName.trim().toLowerCase();
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.keys(counts).filter(name => counts[name] > 1);
  }, [localSlots]);

  if (!isOpen) return null;

  // Search and filter logic
  const filteredSlots = localSlots.filter(s => {
    // 1. Search term
    const matchesSearch = 
      s.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.players || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slotNumber.toString() === searchTerm;

    if (!matchesSearch) return false;

    // 2. Filter type
    if (filterType === 'named') return s.teamName.trim().length > 0;
    if (filterType === 'empty') return s.teamName.trim().length === 0;
    if (filterType === 'with-players') return (s.players || '').trim().length > 0;
    return true; // 'all'
  });

  // Handle single row update
  const handleLocalUpdate = (id: string, field: keyof SlotEntry, value: any) => {
    setLocalSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Handle logo upload event
  const handleLocalLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const compressed = await compressImage(base64, 200, 200);
        handleLocalUpdate(id, 'logo', compressed);
      } catch (err) {
        console.error("Logo compression/upload failed:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add a new empty slot
  const handleAddLocalSlot = () => {
    const nextSlotNumber = localSlots.length > 0 
      ? Math.max(...localSlots.map(s => s.slotNumber)) + 1 
      : 1;

    const newSlot: SlotEntry = {
      id: Math.random().toString(36).substring(2, 9),
      slotNumber: nextSlotNumber,
      teamName: '',
      players: ''
    };
    setLocalSlots(prev => [...prev, newSlot]);
  };

  // Delete a slot row
  const handleDeleteLocalSlot = (id: string) => {
    setLocalSlots(prev => prev.filter(s => s.id !== id));
  };

  // BULK ACTIONS IMPLEMENTATION
  const applyUppercaseTeams = () => {
    setLocalSlots(prev => prev.map(s => ({
      ...s,
      teamName: s.teamName.toUpperCase()
    })));
  };

  const applyTitleCaseTeams = () => {
    setLocalSlots(prev => prev.map(s => ({
      ...s,
      teamName: s.teamName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
    })));
  };

  const applyAddTeamPrefixSuffix = () => {
    setLocalSlots(prev => prev.map(s => {
      if (!s.teamName.trim()) return s;
      let newName = s.teamName;
      if (teamPrefix) newName = teamPrefix + newName;
      if (teamSuffix) newName = newName + teamSuffix;
      return { ...s, teamName: newName };
    }));
    setTeamPrefix('');
    setTeamSuffix('');
  };

  const applyFormatPlayers = () => {
    setLocalSlots(prev => prev.map(s => {
      if (!s.players) return s;
      // Split players, trim whitespace, and join nicely with dynamic capitalization
      const list = s.players.split(',').map(p => {
        const trimmed = p.trim();
        return trimmed.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
      });
      return {
        ...s,
        players: list.filter(p => p.length > 0).join(', ')
      };
    }));
  };

  const applySortAlphabetically = () => {
    // Sort while keeping slots number reassigned or keep original slot numbers?
    // User expects slots list to easily be sorted. Let's sort alphabetically but preserve slotNumber or update slotNumber.
    // Let's sort them by team name, placing empty team names at the bottom.
    const withNames = localSlots.filter(s => s.teamName.trim().length > 0);
    const withoutNames = localSlots.filter(s => s.teamName.trim().length === 0);
    
    withNames.sort((a, b) => a.teamName.localeCompare(b.teamName));
    
    // Combine and re-assign slot number for sequence
    const combined = [...withNames, ...withoutNames];
    const sequenceUpdated = combined.map((s, idx) => ({
      ...s,
      slotNumber: idx + 1
    }));

    setLocalSlots(sequenceUpdated);
  };

  const applyClearAllLogos = () => {
    if (confirm("Are you sure you want to discard all team logos? This cannot be undone.")) {
      setLocalSlots(prev => prev.map(s => ({ ...s, logo: undefined })));
    }
  };

  const applyClearAllPlayers = () => {
    if (confirm("Are you sure you want to clear player names for all teams?")) {
      setLocalSlots(prev => prev.map(s => ({ ...s, players: '' })));
    }
  };

  const applyReorderSlots = () => {
    // Reset slot numbers in sequential order start from 1
    setLocalSlots(prev => {
      const sortedByCurrentNum = [...prev].sort((a, b) => a.slotNumber - b.slotNumber);
      return sortedByCurrentNum.map((s, index) => ({
        ...s,
        slotNumber: index + 1
      }));
    });
  };

  // Save changes and submit
  const handleSaveAll = () => {
    onUpdateSlots(localSlots);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className={`w-full max-w-5xl h-[85vh] flex flex-col border shadow-2xl overflow-hidden rounded-xl transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#141414] border-white/10 text-white shadow-orange-500/5' 
          : 'bg-[#F2F1ED] border-[#141414]/30 text-[#141414]'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b shrink-0 ${
          isDarkMode ? 'border-white/10 bg-[#1b1b1b]' : 'border-[#141414]/20 bg-white/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-500 text-white'}`}>
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider font-sans">
                Centralized Bulk Team Manager
              </h2>
              <p className="text-[10px] font-mono opacity-50 uppercase tracking-tight mt-0.5">
                Centralized administration panel to edit multiple slots, uploads, team identities, and players at once.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors duration-150 ${
              isDarkMode ? 'hover:bg-white/5 text-white/60 hover:text-white' : 'hover:bg-black/5 text-[#141414]/60 hover:text-[#141414]'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Section */}
        <div className={`p-4 border-b shrink-0 flex flex-col gap-3 ${
          isDarkMode ? 'border-white/10 bg-[#141414]' : 'border-[#141414]/10 bg-white/20'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by team, player name, or slot #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs font-mono rounded-lg outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-white/5 border border-white/10 text-white focus:border-white/30' 
                    : 'bg-white border border-[#141414]/20 text-black focus:border-[#141414]'
                }`}
              />
              <Search size={14} className="absolute left-3 top-3 opacity-30" />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 font-mono shrink-0 hidden sm:inline">
                Show:
              </span>
              {(['all', 'named', 'empty', 'with-players'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
                    filterType === type
                      ? (isDarkMode ? 'bg-white text-black font-black' : 'bg-[#141414] text-white font-black')
                      : (isDarkMode ? 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10' : 'bg-white border border-[#141414]/10 text-[#141414]/60 hover:bg-black/5')
                  }`}
                >
                  {type === 'all' && 'All Slots'}
                  {type === 'named' && 'With Names'}
                  {type === 'empty' && 'Empty Names'}
                  {type === 'with-players' && 'With Players'}
                </button>
              ))}
            </div>

            {/* Bulk Actions Button Trigger */}
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-lg border transition-all ${
                showBulkActions
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : (isDarkMode ? 'bg-[#181818] border-white/10 text-white/80 hover:bg-white/5' : 'bg-white border-[#141414]/10 text-black hover:bg-black/5')
              }`}
            >
              <Settings size={14} className={showBulkActions ? 'animate-spin' : ''} />
              <span>Bulk Tools</span>
              {showBulkActions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Expanded Bulk Actions Drawer */}
          {showBulkActions && (
            <div className={`p-4 rounded-xl border animate-slideDown ${
              isDarkMode ? 'bg-[#1f1f1f] border-white/5 text-white' : 'bg-[#eaebec] border-[#141414]/10 text-black'
            }`}>
              <h4 className="text-[10px] uppercase font-black font-mono tracking-widest text-orange-500 mb-3 flex items-center gap-1.5">
                <Sparkles size={12} /> Transformative Bulk Actions
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Column 1: Team Text Actions */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold opacity-45 block">Text Formats</span>
                  <button
                    onClick={applyUppercaseTeams}
                    className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                      isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-black/5'
                    }`}
                  >
                    <CaseSensitive size={14} className="text-orange-500" />
                    <span>UPPERCASE TEAMS</span>
                  </button>
                  <button
                    onClick={applyTitleCaseTeams}
                    className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                      isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-black/5'
                    }`}
                  >
                    <CaseSensitive size={14} className="text-blue-500" />
                    <span>Title Case Teams</span>
                  </button>
                </div>

                {/* Column 2: Prefix and Suffix */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold opacity-45 block">Esports Tag Suffix/Prefix</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Prefix"
                      value={teamPrefix}
                      onChange={(e) => setTeamPrefix(e.target.value)}
                      className={`w-1/2 p-1.5 text-[10px] font-mono outline-none rounded-md border ${
                        isDarkMode ? 'bg-[#141414] border-white/10 focus:border-white/30 text-white' : 'bg-white border-[#141414]/20 text-black'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Suffix"
                      value={teamSuffix}
                      onChange={(e) => setTeamSuffix(e.target.value)}
                      className={`w-1/2 p-1.5 text-[10px] font-mono outline-none rounded-md border ${
                        isDarkMode ? 'bg-[#141414] border-white/10 focus:border-white/30 text-white' : 'bg-white border-[#141414]/20 text-black'
                      }`}
                    />
                  </div>
                  <button
                    onClick={applyAddTeamPrefixSuffix}
                    disabled={!teamPrefix && !teamSuffix}
                    className="w-full py-1.5 text-center rounded-lg text-[10px] font-bold font-mono tracking-widest bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white disabled:opacity-40 transition-all flex items-center justify-center gap-1"
                  >
                    <Plus size={11} /> APPLY TAGS
                  </button>
                </div>

                {/* Column 3: Sorting & Sequencing */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold opacity-45 block">Sort & Sequence</span>
                  <button
                    onClick={applySortAlphabetically}
                    className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                      isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-black/5'
                    }`}
                    title="Sorts teams alphabetically by name"
                  >
                    <SortAsc size={14} className="text-emerald-500" />
                    <span>Sort Teams A-Z</span>
                  </button>
                  <button
                    onClick={applyReorderSlots}
                    className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                      isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-black/5'
                    }`}
                    title="Resets slot numbers to cleanly start at 1, 2, 3 onward"
                  >
                    <RefreshCw size={14} className="text-yellow-500" />
                    <span>Sequencing Reset (1-X)</span>
                  </button>
                </div>

                {/* Column 4: Formatting and Destructive Clear */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-mono font-bold opacity-45 block">Players & Assets Cleaner</span>
                  <button
                    onClick={applyFormatPlayers}
                    className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                      isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-black/5'
                    }`}
                  >
                    <Users size={14} className="text-purple-500" />
                    <span>Auto-Format Players (Title Case)</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={applyClearAllLogos}
                      className="w-1/2 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash size={12} /> Clear Logos
                    </button>
                    <button
                      onClick={applyClearAllPlayers}
                      className="w-1/2 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash size={12} /> Clear Players
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Scrollable Main Workspace Table Area */}
        <div className="flex-1 overflow-y-auto min-h-[150px]">
          {/* Warning Message Box */}
          {duplicateTeamNames.length > 0 && (
            <div className={`mx-4 mt-4 p-3.5 border rounded-xl flex items-start gap-3 animate-pulse ${
              isDarkMode 
                ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <AlertTriangle className="shrink-0 text-red-500 mt-0.5" size={18} />
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider font-mono">
                  Duplicate Team Assignments Detected!
                </h5>
                <p className="text-[11px] opacity-80 mt-1">
                  The following teams are assigned to more than one slot:{" "}
                  <span className="font-semibold underline">
                    {localSlots
                      .filter(s => duplicateTeamNames.includes(s.teamName.trim().toLowerCase()))
                      .map(s => s.teamName.trim())
                      .filter((val, i, arr) => arr.indexOf(val) === i)
                      .join(', ')}
                  </span>.
                  Please ensure every competing team is assigned to exactly one unique slot to avoid leaderboard issues.
                </p>
              </div>
            </div>
          )}
          {filteredSlots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Users size={48} className="text-orange-500/25 mb-3" />
              <p className="text-sm font-mono opacity-50 uppercase">No team slots match the filter criteria</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-2 text-xs font-bold text-orange-500 hover:underline"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="border-collapse w-full">
              {/* Fake Table Header */}
              <div className={`sticky top-0 z-30 flex items-center px-4 py-3 bg-[#111111] text-[#A3A3A3] text-[10px] font-black uppercase font-mono tracking-widest border-b ${
                isDarkMode ? 'border-white/10 bg-[#111] text-white/55' : 'bg-[#141414] text-[#E4E3E0]'
              }`}>
                <div className="w-[10%] min-w-[50px] shrink-0 text-center">Slot</div>
                <div className="w-[12%] min-w-[60px] shrink-0 text-center">Identity (Logo)</div>
                <div className="w-[28%] min-w-[150px] shrink-0 px-2">Team Name</div>
                <div className="w-[42%] min-w-[200px] shrink-0 px-2">Players (Comma Separated list)</div>
                <div className="w-[8%] shrink-0 text-right pr-2">Action</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-current/5">
                {filteredSlots.map((slot, index) => (
                  <div 
                    key={slot.id} 
                    className={`flex items-center px-4 py-3 group transition-colors duration-100 ${
                      isDarkMode 
                        ? 'hover:bg-white/5 border-white/5 text-white' 
                        : 'hover:bg-black/5 border-black/5 text-[#141414]'
                    }`}
                  >
                    
                    {/* Slot Number */}
                    <div className="w-[10%] min-w-[50px] shrink-0 text-center flex items-center justify-center">
                      <div className={`w-8 h-8 flex items-center justify-center border font-mono text-xs font-bold ${
                        isDarkMode 
                          ? 'border-white/20 bg-white text-black' 
                          : 'border-[#141414] bg-[#141414] text-[#E4E3E0]'
                      }`}>
                        {slot.slotNumber}
                      </div>
                    </div>

                    {/* Logo upload block */}
                    <div className="w-[12%] min-w-[60px] shrink-0 flex items-center justify-center relative">
                      <input
                        type="file"
                        id={`bulk-logo-${slot.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleLocalLogoUpload(slot.id, e)}
                      />
                      <label
                        htmlFor={`bulk-logo-${slot.id}`}
                        className={`w-10 h-10 border rounded-lg flex items-center justify-center cursor-pointer transition-all overflow-hidden relative group/logo ${
                          isDarkMode
                            ? 'border-white/10 bg-white/5 hover:bg-white/10'
                            : 'border-[#141414]/20 bg-white hover:bg-black/5'
                        }`}
                      >
                        {slot.logo ? (
                          <>
                            <img
                              src={slot.logo}
                              alt="Logo"
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                            {/* Hover overlay inside logo box */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity">
                              <ImageIcon size={12} className="text-white" />
                            </div>
                          </>
                        ) : (
                          <ImageIcon size={14} className="opacity-30 group-hover/logo:opacity-80 transition-opacity" />
                        )}
                      </label>
                      {slot.logo && (
                        <button
                          onClick={() => handleLocalUpdate(slot.id, 'logo', undefined)}
                          className="absolute top-0 right-2 w-4 h-4 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all scale-90 group-hover:scale-100"
                          title="Discard logo asset"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>

                    {/* Team Name Input */}
                    <div className="w-[28%] min-w-[150px] shrink-0 px-2 relative group/item-input">
                      {slot.teamName.trim() && duplicateTeamNames.includes(slot.teamName.trim().toLowerCase()) ? (
                        <>
                          <input
                            type="text"
                            value={slot.teamName}
                            onChange={(e) => handleLocalUpdate(slot.id, 'teamName', e.target.value)}
                            placeholder="Assign Team name..."
                            className={`w-full bg-transparent border-b outline-none py-1.5 px-2 text-sm font-bold transition-all focus:px-3 ${
                              isDarkMode
                                ? 'border-red-500 bg-red-500/10 text-red-400 focus:border-red-400 focus:bg-red-500/15'
                                : 'border-red-500 bg-red-100/50 text-red-700 focus:border-red-600 focus:bg-red-50'
                            }`}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-red-500 tracking-wider bg-red-500/10 px-1 py-0.5 rounded pointer-events-none animate-pulse">
                            Duplicate
                          </span>
                        </>
                      ) : (
                        <input
                          type="text"
                          value={slot.teamName}
                          onChange={(e) => handleLocalUpdate(slot.id, 'teamName', e.target.value)}
                          placeholder="Assign Team name..."
                          className={`w-full bg-transparent border-b outline-none py-1.5 px-2 text-sm font-bold transition-all focus:px-3 ${
                            isDarkMode
                              ? 'border-white/10 focus:border-white/40 focus:bg-white/5 text-white'
                              : 'border-[#141414]/20 focus:border-[#141414] focus:bg-white text-[#141414]'
                          }`}
                        />
                      )}
                    </div>

                    {/* Players List comma-separated input */}
                    <div className="w-[42%] min-w-[200px] shrink-0 px-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={slot.players || ''}
                        onChange={(e) => handleLocalUpdate(slot.id, 'players', e.target.value)}
                        placeholder="Players: Scout, Regaltos, Mavi, Viper..."
                        className={`w-full bg-transparent border-b outline-none py-1.5 px-2 text-xs font-mono transition-all focus:px-3 ${
                          isDarkMode
                            ? 'border-white/10 focus:border-white/30 focus:bg-white/5 text-white/80'
                            : 'border-[#141414]/15 focus:border-[#141414]/50 focus:bg-white text-[#141414]/80'
                        }`}
                      />
                    </div>

                    {/* Single Row Actions */}
                    <div className="w-[8%] shrink-0 text-right pr-2">
                      <button
                        onClick={() => handleDeleteLocalSlot(slot.id)}
                        className={`p-1.5 rounded-md transition-all ${
                          isDarkMode
                            ? 'text-red-400/30 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-red-600/30 hover:text-red-600 hover:bg-red-500/10'
                        }`}
                        title="Delete slot row entire data"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions block */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
          isDarkMode ? 'border-white/10 bg-[#141414]' : 'border-[#141414]/20 bg-[#F2F1ED]'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddLocalSlot}
              className={`px-3 py-2 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 rounded-lg border transition-all ${
                isDarkMode 
                  ? 'bg-neutral-800 border-white/10 text-white hover:bg-neutral-700' 
                  : 'bg-white border-[#141414]/20 text-black hover:bg-black/5'
              }`}
            >
              <UserPlus size={14} className="text-orange-500" />
              <span>Add Custom Slot Row</span>
            </button>
            <span className="text-[10px] uppercase font-mono opacity-50 shrink-0">
              Total Count: {localSlots.length} Slots
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-white/5 text-white hover:text-white' : 'hover:bg-black/5 text-black hover:text-black'
              }`}
            >
              Discard
            </button>
            
            <button
              onClick={handleSaveAll}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white rounded-lg shadow-xl shrink-0 flex items-center gap-2 transition-all active:scale-[0.98] ${
                isSaved 
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-500/10' 
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
              }`}
            >
              {isSaved ? (
                <>
                  <span>CHANGES APPLIED!</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Board Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
