import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Eye,
  EyeOff,
  Check,
  X,
  LineChart as ChartIcon,
  HelpCircle,
  Award
} from 'lucide-react';

interface MatchResult {
  rank: number;
  teamName: string;
  kills: number;
  placementPoints: number;
  totalPoints: number;
}

interface HistoryEntry {
  id: string;
  gameType: string;
  tournamentType: string;
  groupName: string;
  timestamp: string | number;
  results: MatchResult[];
}

interface TournamentProgressionProps {
  matchHistory: HistoryEntry[];
  gameType: string;
  tournamentType: string;
  groupName: string;
  customTournamentName: string;
  customGroupName: string;
  isDarkMode: boolean;
}

const COLORS_POOL = [
  "#f97316", // Orange
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#eab308", // Yellow
  "#a855f7", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#84cc16", // Lime
  "#38bdf8", // Sky
  "#6366f1", // Indigo
  "#d946ef", // Fuchsia
  "#f59e0b", // Amber
  "#10b981", // Emerald
];

export const TournamentProgression: React.FC<TournamentProgressionProps> = ({
  matchHistory,
  gameType,
  tournamentType,
  groupName,
  customTournamentName,
  customGroupName,
  isDarkMode,
}) => {
  const [lineType, setLineType] = useState<'monotone' | 'linear'>('monotone');

  // Filter match history to match the active tournament characteristics
  const filteredMatches = useMemo(() => {
    const finalTournamentName =
      tournamentType === "Custom"
        ? customTournamentName || "Custom"
        : tournamentType;
    const finalGroupName =
      groupName === "Custom" ? customGroupName || "Custom" : groupName;

    const matches = matchHistory.filter(
      (h) =>
        h.gameType === gameType &&
        h.tournamentType === finalTournamentName &&
        h.groupName === finalGroupName
    );

    // Sort chronologically ascending
    return [...matches].sort((a, b) => {
      const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }, [matchHistory, gameType, tournamentType, groupName, customTournamentName, customGroupName]);

  // Identify all participating teams in these matches
  const uniqueTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    filteredMatches.forEach((match) => {
      match.results.forEach((res) => {
        if (res.teamName) {
          teamsSet.add(res.teamName.trim());
        }
      });
    });
    return Array.from(teamsSet);
  }, [filteredMatches]);

  // Map each team to a stable color
  const teamColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    uniqueTeams.sort().forEach((team, index) => {
      map[team] = COLORS_POOL[index % COLORS_POOL.length];
    });
    return map;
  }, [uniqueTeams]);

  // Calculate accumulated points match-by-match
  const { chartData, finalStandings } = useMemo(() => {
    const data: any[] = [];
    const cumulativePoints: Record<string, number> = {};

    // Initialize all teams to 0 accumulated points (Match 0)
    const baseEntry: any = { matchName: 'Start', isBase: true, details: {} };
    uniqueTeams.forEach((team) => {
      cumulativePoints[team] = 0;
      baseEntry[team] = 0;
      baseEntry.details[team] = { gain: 0, rank: 1 };
    });
    data.push(baseEntry);

    filteredMatches.forEach((match, idx) => {
      const matchGains: Record<string, number> = {};
      uniqueTeams.forEach((team) => {
        matchGains[team] = 0;
      });

      // Accumulate scores
      match.results.forEach((res) => {
        const team = res.teamName.trim();
        const pt = res.totalPoints || 0;
        matchGains[team] = pt;
        cumulativePoints[team] = (cumulativePoints[team] || 0) + pt;
      });

      const entry: any = {
        matchName: `Match ${idx + 1}`,
        fullDate: new Date(match.timestamp).toLocaleDateString(),
        isBase: false,
        details: {},
      };

      // Fill values for all unique teams (carrying forward current total if they missed this match)
      const currentStandingsAtThisMatch = uniqueTeams.map((team) => {
        const totalAtThisMatch = cumulativePoints[team] || 0;
        entry[team] = totalAtThisMatch;
        return {
          teamName: team,
          total: totalAtThisMatch,
        };
      });

      // Calculate ranks for this match
      currentStandingsAtThisMatch.sort((a, b) => b.total - a.total);
      
      let curRank = 1;
      currentStandingsAtThisMatch.forEach((itemAtMatch, idxInList) => {
        if (idxInList > 0 && itemAtMatch.total < currentStandingsAtThisMatch[idxInList - 1].total) {
          curRank = idxInList + 1;
        }
        
        const team = itemAtMatch.teamName;
        entry.details[team] = {
          gain: matchGains[team] || 0,
          rank: curRank,
        };
      });

      data.push(entry);
    });

    const standings = Object.keys(cumulativePoints).map((team) => ({
      teamName: team,
      totalPoints: cumulativePoints[team],
      color: teamColorMap[team] || '#ccc',
    })).sort((a, b) => b.totalPoints - a.totalPoints);

    return { chartData: data, finalStandings: standings };
  }, [filteredMatches, uniqueTeams, teamColorMap]);

  // Checked teams state to control which lines are drawn
  // By default, let's keep only the Top 5 checked so the chart is crisp but customizable
  const [selectedTeams, setSelectedTeams] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    const top5Names = finalStandings.slice(0, 5).map(s => s.teamName);
    uniqueTeams.forEach((team) => {
      initial[team] = top5Names.includes(team);
    });
    return initial;
  });

  // Re-sync selection if teams population changes significantly
  React.useEffect(() => {
    const top5Names = finalStandings.slice(0, 5).map(s => s.teamName);
    const updated: Record<string, boolean> = {};
    uniqueTeams.forEach((team) => {
      updated[team] = selectedTeams[team] !== undefined ? selectedTeams[team] : top5Names.includes(team);
    });
    setSelectedTeams(updated);
  }, [uniqueTeams, finalStandings]);

  const handleToggleTeam = (team: string) => {
    setSelectedTeams((prev) => ({
      ...prev,
      [team]: !prev[team],
    }));
  };

  const handleSelectQuickPreset = (preset: 'top3' | 'top5' | 'top10' | 'all' | 'none') => {
    const updated: Record<string, boolean> = {};
    const topNames = finalStandings.map(s => s.teamName);
    
    uniqueTeams.forEach((team) => {
      const rank = topNames.indexOf(team);
      if (preset === 'top3') {
        updated[team] = rank !== -1 && rank < 3;
      } else if (preset === 'top5') {
        updated[team] = rank !== -1 && rank < 5;
      } else if (preset === 'top10') {
        updated[team] = rank !== -1 && rank < 10;
      } else if (preset === 'all') {
        updated[team] = true;
      } else {
        updated[team] = false;
      }
    });
    setSelectedTeams(updated);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const sortedPayload = [...payload].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

    return (
      <div className={`p-4 border rounded-2xl shadow-xl max-w-sm max-h-[350px] overflow-y-auto ${
        isDarkMode 
          ? 'bg-[#141414]/95 border-white/10 text-[#E4E3E0] backdrop-blur-md'
          : 'bg-white/95 border-[#141414]/15 text-[#141414] backdrop-blur-md'
      }`}>
        <div className="border-b border-gray-500/10 pb-2 mb-2.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-orange-500 font-extrabold flex items-center gap-1">
            <TrendingUp size={11} /> Standings Snapshot
          </p>
          <div className="flex justify-between items-baseline mt-0.5">
            <p className="font-serif italic text-sm font-bold uppercase">{label}</p>
            {payload[0]?.payload?.fullDate && (
              <span className="text-[9px] font-mono opacity-40">{payload[0].payload.fullDate}</span>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {sortedPayload.map((item, index) => {
            const teamName = item.name;
            const totalPoints = item.value;
            const details = item.payload.details?.[teamName];
            const gain = details?.gain ?? 0;
            const rank = details?.rank ?? 1;
            const color = item.color || item.stroke;
            const isBase = item.payload.isBase;

            return (
              <div key={index} className="flex items-center justify-between gap-4 py-0.5 group">
                <div className="flex items-center gap-2 truncate">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-black/5 dark:border-white/5" 
                    style={{ backgroundColor: color }}
                  />
                  <div className="truncate">
                    <div className="text-[11px] font-bold truncate tracking-tight">{teamName}</div>
                    <div className="text-[9px] font-mono opacity-50 flex items-center gap-1.5 leading-none">
                      <span className="font-semibold text-orange-500">#{rank} Rank</span>
                      {!isBase && (
                        <span className={`font-bold ${gain > 0 ? "text-green-500" : "opacity-40"}`}>
                          {gain > 0 ? `+${gain} pts` : `0 pts`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-xs">{totalPoints}</span>
                  <span className="text-[8px] font-mono opacity-40 uppercase tracking-tighter ml-0.5">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (filteredMatches.length === 0) {
    return (
      <div className={`p-8 border rounded-2xl flex flex-col items-center justify-center text-center ${
        isDarkMode 
          ? 'bg-[#141414] border-white/10 text-[#E4E3E0]' 
          : 'bg-white border-[#141414]/10 text-[#141414]'
      }`}>
        <ChartIcon size={48} className="text-orange-500 opacity-40 mb-3 animate-pulse" />
        <h4 className="text-sm font-bold uppercase tracking-wider font-mono">No Progression Data Available</h4>
        <p className="text-[11px] opacity-60 max-w-sm mt-1.5 leading-relaxed font-sans">
          To generate a tournament progression, please add overall standings or log matches in the "Match-wise" input tab first.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-white' : 'text-[#141414]'}`}>
      {/* Chart Canvas Card */}
      <div className={`p-6 border rounded-2xl ${
        isDarkMode 
          ? 'bg-[#141414] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-white border-[#141414]/15 shadow-[0_10px_30px_rgba(20,20,20,0.05)]'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-500/10 mb-6 gap-4">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
              <TrendingUp size={12} /> Live Accumulation Curve
            </span>
            <h3 className="text-base font-serif italic font-bold uppercase mt-1">
              Tournament Progression Chart
            </h3>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-[10px] font-mono opacity-50 uppercase">Curve style:</span>
            <div className="inline-flex rounded-md p-0.5 border border-gray-500/10">
              <button
                onClick={() => setLineType('monotone')}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                  lineType === 'monotone'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-[#141414] text-white')
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                Smooth
              </button>
              <button
                onClick={() => setLineType('linear')}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                  lineType === 'linear'
                    ? (isDarkMode ? 'bg-white/10 text-white' : 'bg-[#141414] text-white')
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                Straight
              </button>
            </div>
          </div>
        </div>

        {/* The Recharts Area */}
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(20, 20, 20, 0.05)"}
              />
              <XAxis 
                dataKey="matchName" 
                stroke={isDarkMode ? "#ffffff50" : "#14141450"} 
                fontSize={10} 
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              />
              <YAxis 
                stroke={isDarkMode ? "#ffffff50" : "#14141450"} 
                fontSize={10} 
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              />
              <Tooltip content={<CustomTooltip />} />
              {uniqueTeams.map((team) => {
                if (!selectedTeams[team]) return null;
                return (
                  <Line
                    key={team}
                    type={lineType}
                    dataKey={team}
                    name={team}
                    stroke={teamColorMap[team] || '#fff'}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                    animationDuration={600}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Selection Panel */}
      <div className={`p-5 border rounded-2xl ${
        isDarkMode 
          ? 'bg-[#141414] border-white/10' 
          : 'bg-white border-[#141414]/15'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-500/10">
          <div className="flex items-center gap-2">
            <Award className="text-orange-500" size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Select Teams to Visualize</span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSelectQuickPreset('top3')}
              className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded hover:bg-orange-500 hover:text-white transition-all ${
                isDarkMode ? 'border-white/10 text-white/70' : 'border-[#141414]/10 text-black/70'
              }`}
            >
              Top 3
            </button>
            <button
              onClick={() => handleSelectQuickPreset('top5')}
              className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded hover:bg-orange-500 hover:text-white transition-all ${
                isDarkMode ? 'border-white/10 text-white/70' : 'border-[#141414]/10 text-black/70'
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => handleSelectQuickPreset('top10')}
              className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded hover:bg-orange-500 hover:text-white transition-all ${
                isDarkMode ? 'border-white/10 text-white/70' : 'border-[#141414]/10 text-black/70'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => handleSelectQuickPreset('all')}
              className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded hover:bg-orange-500 hover:text-white transition-all ${
                isDarkMode ? 'border-white/10 text-white/70' : 'border-[#141414]/10 text-black/70'
              }`}
            >
              Show All
            </button>
            <button
              onClick={() => handleSelectQuickPreset('none')}
              className={`px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider border rounded hover:bg-red-500 hover:text-white hover:border-red-500 transition-all ${
                isDarkMode ? 'border-white/10 text-white/70' : 'border-[#141414]/10 text-black/70'
              }`}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Checkbox Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {finalStandings.map((team, sIdx) => {
            const isChecked = !!selectedTeams[team.teamName];
            return (
              <button
                key={team.teamName}
                onClick={() => handleToggleTeam(team.teamName)}
                className={`p-2 border text-left rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                  isChecked
                    ? (isDarkMode 
                        ? 'border-white/20 bg-white/5 text-white shadow-sm' 
                        : 'border-[#141414]/20 bg-gray-50 text-black shadow-sm')
                    : (isDarkMode
                        ? 'border-transparent opacity-45 hover:opacity-100 hover:border-white/10 bg-transparent'
                        : 'border-transparent opacity-45 hover:opacity-100 hover:border-[#141414]/10 bg-transparent')
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: team.color }}
                  />
                  <div className="truncate">
                    <div className="text-[11px] font-bold truncate">{team.teamName}</div>
                    <div className="text-[8px] font-mono opacity-50 font-semibold">{team.totalPoints} PTS (#{sIdx + 1})</div>
                  </div>
                </div>
                <div>
                  {isChecked ? (
                    <Eye size={12} className="text-orange-500 shrink-0" />
                  ) : (
                    <EyeOff size={11} className="opacity-40 group-hover:opacity-100 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
