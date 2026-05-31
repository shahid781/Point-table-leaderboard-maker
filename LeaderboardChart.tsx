
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MatchResult {
  rank: number;
  teamName: string;
  kills: number;
  placementPoints: number;
  totalPoints: number;
}

interface HistoryEntry {
  id: string;
  results: MatchResult[];
}

interface LeaderboardChartProps {
  matchHistory: HistoryEntry[];
}

export const LeaderboardChart: React.FC<LeaderboardChartProps> = ({ matchHistory }) => {
  // Process match history to point progression
  const chartData = matchHistory.map((match, index) => {
    const dataRow: any = { match: `Match ${index + 1}` };
    match.results.forEach((result) => {
        dataRow[result.teamName] = result.totalPoints;
    });
    return dataRow;
  });

  // Calculate cumulative points
  const cumulativeData = chartData.map((data, index) => {
      const row = { ...data };
      if (index > 0) {
          const prev = cumulativeData[index - 1];
          Object.keys(data).forEach(key => {
              if (key !== 'match') {
                  row[key] = (prev[key] || 0) + (data[key] || 0);
              }
          });
      }
      return row;
  });

  // Get top 5 teams by last match total points
  const lastMatch = cumulativeData[cumulativeData.length - 1] || {};
  const topTeams = Object.keys(lastMatch)
    .filter(key => key !== 'match')
    .sort((a, b) => (lastMatch[b] || 0) - (lastMatch[a] || 0))
    .slice(0, 5);

  const colors = ["#f97316", "#ef4444", "#22c55e", "#3b82f6", "#eab308"];

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 h-[300px]">
      <h3 className="text-white text-sm font-bold mb-4 uppercase">Top 5 Point Progression</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={cumulativeData}>
          <XAxis dataKey="match" stroke="#ffffff50" fontSize={10} />
          <YAxis stroke="#ffffff50" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white' }} />
          <Legend wrapperStyle={{ fontSize: '10px' }} />
          {topTeams.map((team, index) => (
            <Line key={team} type="monotone" dataKey={team} stroke={colors[index % colors.length]} strokeWidth={2} dot={{r: 4}} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
