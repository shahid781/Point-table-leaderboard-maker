import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { Trophy, Swords, Zap, Search, ChevronUp, BarChart3 } from 'lucide-react';

interface LeaderboardEntry {
  teamName: string;
  logo?: string;
  matchesPlayed: number;
  wwcd: number;
  totalKills: number;
  totalPlacementPoints: number;
  totalPoints: number;
}

interface StatsSummaryProps {
  leaderboardData: LeaderboardEntry[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ leaderboardData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!leaderboardData || leaderboardData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <Trophy size={48} className="opacity-20 mb-4 animate-pulse" />
        <p className="font-mono text-sm uppercase">No stats data found for selected group</p>
      </div>
    );
  }

  // 1. Calculations
  const totalKills = leaderboardData.reduce((acc, row) => acc + row.totalKills, 0);
  const totalMatchesPlayed = leaderboardData.reduce((acc, row) => acc + (row.matchesPlayed || 0), 0);
  
  // Overall Avg Kills per team per match
  const overallAvgKills = totalMatchesPlayed > 0 
    ? (totalKills / totalMatchesPlayed).toFixed(2) 
    : "0.00";

  // Top Fragging Team (Max Kills)
  const topFraggingTeam = [...leaderboardData].sort((a, b) => b.totalKills - a.totalKills)[0];
  
  // WWCD Leader (Max Wins)
  const wwcdLeader = [...leaderboardData].sort((a, b) => b.wwcd - a.wwcd)[0];

  // Process team stats
  const processedData = leaderboardData.map(team => {
    const avgKillsPerMatch = team.matchesPlayed > 0 
      ? Number((team.totalKills / team.matchesPlayed).toFixed(2))
      : 0;
    const winRate = team.matchesPlayed > 0 
      ? Number(((team.wwcd / team.matchesPlayed) * 100).toFixed(1))
      : 0;
    return {
      ...team,
      avgKillsPerMatch,
      winRate
    };
  });

  // Filtered lists for breakdown
  const filteredTeams = processedData.filter(t => 
    t.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Top 8 teams for Average Kills Chart
  const topKillsChartData = [...processedData]
    .sort((a, b) => b.avgKillsPerMatch - a.avgKillsPerMatch)
    .slice(0, 8);

  // Top 8 teams for Win Rate Chart
  const topWinRateChartData = [...processedData]
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 8);

  const colors = [
    "#f97316", // Orange
    "#ef4444", // Red
    "#3b82f6", // Blue
    "#22c55e", // Green
    "#eab308", // Yellow
    "#ec4899", // Pink
    "#a855f7", // Purple
    "#06b6d4"  // Cyan
  ];

  return (
    <div className="space-y-6 text-white">
      {/* 1. Header Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tournament Kills */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-50 block mb-1">Total Tournament Kills</span>
            <span className="text-3xl font-black font-sans tracking-tight text-white block">{totalKills}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-white/40">GLOBAL AVG KILLS / MATCH</span>
            <span className="text-xs font-mono font-bold text-orange-500">{overallAvgKills}</span>
          </div>
          <Swords className="absolute top-4 right-4 text-orange-500/15 w-12 h-12 pointer-events-none" strokeWidth={1.5} />
        </div>

        {/* Total Matches Count */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-50 block mb-1">Cumulative Matches Played</span>
            <span className="text-3xl font-black font-sans tracking-tight text-white block">{totalMatchesPlayed}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-white/40">TEAMS COMPETING</span>
            <span className="text-xs font-mono font-bold text-blue-500">{leaderboardData.length}</span>
          </div>
          <Zap className="absolute top-4 right-4 text-blue-500/15 w-12 h-12 pointer-events-none" strokeWidth={1.5} />
        </div>

        {/* Top Fragging Team */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-50 block mb-1">Top Fragging Team</span>
            <div className="flex items-center gap-2 mt-1">
              {topFraggingTeam?.logo && (
                <img src={topFraggingTeam.logo} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
              )}
              <span className="text-lg font-bold font-sans tracking-tight text-white block truncate max-w-[150px]">
                {topFraggingTeam?.teamName || 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-white/40">TOTAL KILLS (AVG)</span>
            <span className="text-xs font-mono font-bold text-red-500">
              {topFraggingTeam?.totalKills || 0} 
              <span className="text-[9px] opacity-40 ml-1">
                ({topFraggingTeam?.matchesPlayed ? (topFraggingTeam.totalKills / topFraggingTeam.matchesPlayed).toFixed(1) : 0})
              </span>
            </span>
          </div>
          <Trophy className="absolute top-4 right-4 text-red-500/15 w-12 h-12 pointer-events-none" strokeWidth={1.5} />
        </div>

        {/* WWCD Leader */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-50 block mb-1">WWCD Leader</span>
            <div className="flex items-center gap-2 mt-1">
              {wwcdLeader?.logo && (
                <img src={wwcdLeader.logo} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
              )}
              <span className="text-lg font-bold font-sans tracking-tight text-white block truncate max-w-[150px]">
                {wwcdLeader?.teamName || 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-white/40">CHICKEN DINNERS (RATE)</span>
            <span className="text-xs font-mono font-bold text-yellow-500">
              {wwcdLeader?.wwcd || 0} 
              <span className="text-[9px] opacity-40 ml-1">
                ({wwcdLeader?.matchesPlayed ? ((wwcdLeader.wwcd / wwcdLeader.matchesPlayed) * 100).toFixed(0) : 0}%)
              </span>
            </span>
          </div>
          <Trophy className="absolute top-4 right-4 text-yellow-500/15 w-12 h-12 pointer-events-none" strokeWidth={1.5} />
        </div>
      </div>

      {/* 2. Visualizations / Charts Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart A: Top Teams by Average Kills */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="text-orange-500 w-4 h-4" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">Top 8 Teams by Average Kills per Match</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topKillsChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#ffffff40" fontSize={10} />
                <YAxis dataKey="teamName" type="category" stroke="#ffffff40" fontSize={10} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff15', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="avgKillsPerMatch" radius={[0, 4, 4, 0]}>
                  {topKillsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Top Teams by Win Rate */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-500 w-4 h-4" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold">Top 8 Teams by Win Rate (WWCD %)</h3>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topWinRateChartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="teamName" stroke="#ffffff40" fontSize={9} tickLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #ffffff15', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {topWinRateChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[(index + 3) % colors.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Detailed Stats Table */}
      <div className="bg-white/5 border border-[#141414] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h3 className="font-mono text-xs uppercase tracking-wider font-bold">Detailed Team-by-Team Performance Statistics</h3>
          
          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search team stats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 px-3 py-1.5 pl-8 rounded-lg focus:outline-none focus:border-white/30 transition-all font-mono"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-[10px] font-mono uppercase tracking-widest text-[#E4E3E0] border-b border-white/10">
                <th className="p-3 pl-4">Team</th>
                <th className="p-3 text-center">Matches</th>
                <th className="p-3 text-center">WWCD (Wins)</th>
                <th className="p-3 text-center">Win Rate (%)</th>
                <th className="p-3 text-center">Total Kills</th>
                <th className="p-3 text-center">Avg Kills / Match</th>
                <th className="p-3 text-right pr-4">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredTeams.map((team, idx) => (
                <tr key={team.teamName} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 pl-4 flex items-center gap-2">
                    {team.logo ? (
                      <img src={team.logo} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-5 h-5 bg-white/10 rounded-sm" />
                    )}
                    <span className="font-bold">{team.teamName}</span>
                  </td>
                  <td className="p-3 text-center font-mono text-xs opacity-80">{team.matchesPlayed}</td>
                  <td className="p-3 text-center font-mono text-xs text-yellow-500 font-bold">{team.wwcd}</td>
                  <td className="p-3 text-center font-mono text-xs font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{team.winRate}%</span>
                      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden hidden sm:block">
                        <div className="bg-yellow-500 h-full" style={{ width: `${Math.min(team.winRate, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono text-xs text-red-400">{team.totalKills}</td>
                  <td className="p-3 text-center font-mono text-xs font-bold text-orange-400">{team.avgKillsPerMatch}</td>
                  <td className="p-3 text-right pr-4 font-mono font-bold text-[#E4E3E0]">{team.totalPoints}</td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 opacity-40 font-mono text-xs">
                    No teams found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
