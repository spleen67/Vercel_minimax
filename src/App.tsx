import { useState, useMemo, useCallback } from 'react';
import VerticalTimeline from './components/VerticalTimeline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Upload,
  FileText,
  ClipboardPaste,
  Trophy,
  AlertTriangle,
  Flag,
  CheckCircle,
  XCircle,
  Filter,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap,
} from 'lucide-react';

// Types
interface MatchEvent {
  id: string;
  time: number;
  type: string;
  team?: 'HOME' | 'AWAY';
  detail?: string;
  points?: number;
}

interface MatchData {
  events: MatchEvent[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamColor: string;
  awayTeamColor: string;
  yellowCardDuration?: number;
  whiteCardDuration?: number;
  matchDate?: string;
  refereeName?: string;
  matchLevel?: string;
  halfTimeMinute?: number;
}

type EventFilter = {
  penalties: boolean;
  yellowCards: boolean;
  redCards: boolean;
  whiteCards: boolean;
  scores: boolean;
  team: 'all' | 'home' | 'away';
};

// Sample data
const sampleMatchData: MatchData = {
  "events": [
    {"id": "1", "time": 83, "type": "Penalty Conceded", "team": "HOME", "detail": "Jeu déloyal"},
    {"id": "2", "time": 224, "type": "Supervisor Alert"},
    {"id": "3", "time": 408, "type": "Advantage"},
    {"id": "4", "time": 460, "type": "Penalty Conceded", "team": "HOME", "detail": "Jeu déloyal"},
    {"id": "5", "time": 635, "type": "Penalty Conceded", "team": "HOME", "detail": "Jeu déloyal"},
    {"id": "6", "time": 894, "type": "Penalty Conceded", "team": "HOME", "detail": "Alignement"},
    {"id": "7", "time": 973, "type": "Advantage"},
    {"id": "8", "time": 980, "type": "Penalty Conceded", "team": "HOME", "detail": "Mêlée"},
    {"id": "9", "time": 1062, "type": "Penalty Conceded", "team": "AWAY", "detail": "Placage/Ruck"},
    {"id": "10", "time": 1154, "type": "Penalty Conceded", "team": "HOME", "detail": "Jeu déloyal"},
    {"id": "11", "time": 1175, "type": "Yellow Card", "team": "HOME", "detail": "Jeu déloyal"},
    {"id": "12", "time": 1279, "type": "Advantage"},
    {"id": "13", "time": 1288, "type": "Penalty Conceded", "team": "HOME", "detail": "Mêlée"},
    {"id": "14", "time": 1825, "type": "Penalty Kick", "team": "AWAY", "points": 3},
    {"id": "15", "time": 2505, "type": "Half Time"},
    {"id": "16", "time": 3475, "type": "Penalty Conceded", "team": "AWAY", "detail": "Espace"},
    {"id": "17", "time": 3480, "type": "White Card", "team": "AWAY", "detail": "Espace"},
    {"id": "18", "time": 3903, "type": "Scrum", "team": "HOME", "detail": "Jouée"},
    {"id": "19", "time": 3965, "type": "Penalty Conceded", "team": "AWAY", "detail": "Alignement"},
    {"id": "20", "time": 4068, "type": "Scrum", "team": "HOME", "detail": "Jouée"},
    {"id": "21", "time": 4153, "type": "Penalty Try", "team": "HOME", "points": 7},
    {"id": "22", "time": 4164, "type": "Yellow Card", "team": "AWAY", "detail": "Jeu déloyal"},
    {"id": "23", "time": 4265, "type": "Advantage"},
    {"id": "24", "time": 4362, "type": "Penalty Conceded", "team": "AWAY", "detail": "Jeu déloyal"},
    {"id": "25", "time": 4566, "type": "Penalty Conceded", "team": "HOME", "detail": "Espace"},
    {"id": "26", "time": 4864, "type": "Full Time"},
    {"id": "27", "time": 4870, "type": "Penalty Conceded", "team": "HOME", "detail": "Mêlée"},
    {"id": "28", "time": 4910, "type": "Scrum", "team": "HOME", "detail": "Jouée"}
  ],
  "homeTeamName": "Chartres",
  "awayTeamName": "Le Rheu",
  "homeTeamColor": "#3b82f6",
  "awayTeamColor": "#878787",
  "yellowCardDuration": 10,
  "whiteCardDuration": 10,
  "matchDate": "2025-12-14",
  "refereeName": "R GOU",
  "matchLevel": "FEDERAL 2"
};

// Utility functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getMinute = (seconds: number): number => Math.floor(seconds / 60);

const getHalf = (seconds: number): 1 | 2 => seconds <= 2400 ? 1 : 2;

const getPeriodIndex = (minutes: number): number => {
  if (minutes < 10) return 0;
  if (minutes < 20) return 1;
  if (minutes < 30) return 2;
  if (minutes < 40) return 3;
  if (minutes < 50) return 4;
  if (minutes < 60) return 5;
  if (minutes < 70) return 6;
  if (minutes < 80) return 7;
  return 8;
};

// Components
const DataInputPanel = ({
  onDataLoaded
}: {
  onDataLoaded: (data: MatchData) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.events && data.homeTeamName && data.awayTeamName) {
          onDataLoaded(data);
          setError(null);
        } else {
          setError('Format JSON invalide. Vérifiez la structure des données.');
        }
      } catch {
        setError('Erreur lors du parsing du JSON.');
      }
    };
    reader.readAsText(file);
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFile(file);
    } else {
      setError('Veuillez déposer un fichier JSON.');
    }
  }, [handleFile]);

  const handlePaste = useCallback(() => {
    try {
      const data = JSON.parse(jsonText);
      if (data.events && data.homeTeamName && data.awayTeamName) {
        onDataLoaded(data);
        setError(null);
        setPasteMode(false);
        setJsonText('');
      } else {
        setError('Format JSON invalide. Vérifiez la structure des données.');
      }
    } catch {
      setError('Erreur lors du parsing du JSON.');
    }
  }, [jsonText, onDataLoaded]);

  const loadSample = useCallback(() => {
    onDataLoaded(sampleMatchData);
    setError(null);
  }, [onDataLoaded]);

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-400" />
        Charger les données du match
      </h2>
      
      {!pasteMode ? (
        <>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-500" />
            <p className="text-slate-300 mb-1">Glissez-déposez votre fichier JSON ici</p>
            <p className="text-slate-500 text-sm">ou cliquez pour sélectionner</p>
            <input
              id="fileInput"
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setPasteMode(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
            >
              <ClipboardPaste className="w-4 h-4" />
              Coller le JSON
            </button>
            <button
              onClick={loadSample}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Charger un exemple
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Collez votre JSON ici..."
            className="w-full h-48 p-4 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-3">
            <button
              onClick={handlePaste}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Valider
            </button>
            <button
              onClick={() => { setPasteMode(false); setError(null); }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

const KPICard = ({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) => (
  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-slate-900/50">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-100 tabular-nums">{value}</p>
        {subValue && <p className="text-slate-500 text-xs mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const PenaltyTable = ({ data }: { data: MatchData }) => {
  const penalties = data.events.filter((e) => e.type === 'Penalty Conceded');
  
  // Group by type, team, and half
  const grouped: Record<string, { home: number; away: number; homeH1: number; homeH2: number; awayH1: number; awayH2: number }> = {};
  
  penalties.forEach((p) => {
    const key = p.detail || 'Non spécifié';
    if (!grouped[key]) {
      grouped[key] = { home: 0, away: 0, homeH1: 0, homeH2: 0, awayH1: 0, awayH2: 0 };
    }
    if (p.team === 'HOME') {
      grouped[key].home++;
      if (getHalf(p.time) === 1) grouped[key].homeH1++;
      else grouped[key].homeH2++;
    } else if (p.team === 'AWAY') {
      grouped[key].away++;
      if (getHalf(p.time) === 1) grouped[key].awayH1++;
      else grouped[key].awayH2++;
    }
  });

  const sorted = Object.entries(grouped).sort(([, a], [, b]) => (b.home + b.away) - (a.home + a.away));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Pénalités par faute, équipe et mi-temps
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="text-left p-3 text-slate-400 font-medium">Type de faute</th>
              <th className="text-center p-3 text-slate-400 font-medium" colSpan={2}>1ère MT</th>
              <th className="text-center p-3 text-slate-400 font-medium" colSpan={2}>2ème MT</th>
              <th className="text-center p-3 text-slate-400 font-medium" colSpan={2}>Total</th>
            </tr>
            <tr className="text-xs">
              <th className="p-2"></th>
              <th className="text-center p-2 text-blue-400">{data.homeTeamName}</th>
              <th className="text-center p-2 text-slate-400">{data.awayTeamName}</th>
              <th className="text-center p-2 text-blue-400">{data.homeTeamName}</th>
              <th className="text-center p-2 text-slate-400">{data.awayTeamName}</th>
              <th className="text-center p-2 text-blue-400">{data.homeTeamName}</th>
              <th className="text-center p-2 text-slate-400">{data.awayTeamName}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([type, counts], idx) => (
              <tr key={type} className={`border-t border-slate-700/50 ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                <td className="p-3 text-slate-200">{type}</td>
                <td className="p-3 text-center text-blue-400 font-medium">{counts.homeH1}</td>
                <td className="p-3 text-center text-slate-400">{counts.awayH1}</td>
                <td className="p-3 text-center text-blue-400 font-medium">{counts.homeH2}</td>
                <td className="p-3 text-center text-slate-400">{counts.awayH2}</td>
                <td className="p-3 text-center text-blue-400 font-bold">{counts.home}</td>
                <td className="p-3 text-center text-slate-300 font-bold">{counts.away}</td>
              </tr>
            ))}
            <tr className="border-t border-slate-600 bg-slate-900/50 font-bold">
              <td className="p-3 text-slate-100">TOTAL</td>
              <td className="p-3 text-center text-blue-400">
                {sorted.reduce((acc, [, c]) => acc + c.homeH1, 0)}
              </td>
              <td className="p-3 text-center text-slate-400">
                {sorted.reduce((acc, [, c]) => acc + c.awayH1, 0)}
              </td>
              <td className="p-3 text-center text-blue-400">
                {sorted.reduce((acc, [, c]) => acc + c.homeH2, 0)}
              </td>
              <td className="p-3 text-center text-slate-400">
                {sorted.reduce((acc, [, c]) => acc + c.awayH2, 0)}
              </td>
              <td className="p-3 text-center text-blue-400">
                {sorted.reduce((acc, [, c]) => acc + c.home, 0)}
              </td>
              <td className="p-3 text-center text-slate-300">
                {sorted.reduce((acc, [, c]) => acc + c.away, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PenaltyPieChart = ({ data }: { data: MatchData }) => {
  const penalties = data.events.filter((e) => e.type === 'Penalty Conceded');
  
  const grouped: Record<string, number> = {};
  penalties.forEach((p) => {
    const key = p.detail || 'Non spécifié';
    grouped[key] = (grouped[key] || 0) + 1;
  });

  const chartData = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const total = penalties.length;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-blue-400" />
        Répartition des pénalitées par type
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              formatter={(value, name) => [`${value} (${((Number(value) / total) * 100).toFixed(1)}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {chartData.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-slate-400">
              {entry.name} <span className="text-slate-200 font-medium">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PenaltyByPeriodChart = ({ data }: { data: MatchData }) => {
  const penalties = data.events.filter((e) => e.type === 'Penalty Conceded');
  
  const periods = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80+'];
  
  const homeByPeriod = periods.map((_, idx) => {
    const range = idx < 8 ? [idx * 10, (idx + 1) * 10] : [80, 100];
    return penalties.filter((p) => {
      const min = getMinute(p.time);
      return p.team === 'HOME' && min >= range[0] && (idx < 8 ? min < range[1] : min >= range[0]);
    }).length;
  });

  const awayByPeriod = periods.map((_, idx) => {
    const range = idx < 8 ? [idx * 10, (idx + 1) * 10] : [80, 100];
    return penalties.filter((p) => {
      const min = getMinute(p.time);
      return p.team === 'AWAY' && min >= range[0] && (idx < 8 ? min < range[1] : min >= range[0]);
    }).length;
  });

  const chartData = periods.map((period, idx) => ({
    period,
    [data.homeTeamName]: homeByPeriod[idx],
    [data.awayTeamName]: awayByPeriod[idx],
  }));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <BarChart className="w-5 h-5 text-blue-400" />
        Pénalités par période de 10 minutes
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
            />
            <Legend />
            <Bar
              dataKey={data.homeTeamName}
              fill={data.homeTeamColor}
              radius={[4, 4, 0, 0]}
              name={data.homeTeamName}
            />
            <Bar
              dataKey={data.awayTeamName}
              fill={data.awayTeamColor}
              radius={[4, 4, 0, 0]}
              name={data.awayTeamName}
            />
            {/* Mi-time reference line */}
            <ReferenceLine x="4" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'MT', fill: '#f59e0b', fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CumulativePenaltyChart = ({ data }: { data: MatchData }) => {
  const penalties = data.events.filter((e) => e.type === 'Penalty Conceded');
  
  const periods = ['0', '10', '20', '30', '40', '50', '60', '70', '80'];
  
  const homeCumulative: number[] = [];
  const awayCumulative: number[] = [];
  
  let homeCount = 0;
  let awayCount = 0;
  
  penalties.forEach((p) => {
    const min = getMinute(p.time);
    const periodIdx = Math.min(getPeriodIndex(min), 8);
    
    if (p.team === 'HOME') homeCount++;
    if (p.team === 'AWAY') awayCount++;
    
    // Calculate cumulative at end of each period
    if (periodIdx === 0) {
      homeCumulative[0] = homeCount;
      awayCumulative[0] = awayCount;
    }
  });

  // Calculate properly
  const homeByPeriod = periods.map((_, idx) => {
    const range = idx < 8 ? [idx * 10, (idx + 1) * 10] : [80, 100];
    return penalties.filter((p) => {
      const min = getMinute(p.time);
      return p.team === 'HOME' && min >= range[0] && (idx < 8 ? min < range[1] : min >= range[0]);
    }).length;
  });

  const awayByPeriod = periods.map((_, idx) => {
    const range = idx < 8 ? [idx * 10, (idx + 1) * 10] : [80, 100];
    return penalties.filter((p) => {
      const min = getMinute(p.time);
      return p.team === 'AWAY' && min >= range[0] && (idx < 8 ? min < range[1] : min >= range[0]);
    }).length;
  });

  let homeCum = 0;
  let awayCum = 0;
  
  const chartData = periods.map((period, idx) => {
    homeCum += homeByPeriod[idx] || 0;
    awayCum += awayByPeriod[idx] || 0;
    return {
      minute: period,
      [data.homeTeamName]: homeCum,
      [data.awayTeamName]: awayCum,
    };
  });

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        Cumul des pénalitées par période
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="minute" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={data.homeTeamName}
              stroke={data.homeTeamColor}
              strokeWidth={3}
              dot={{ fill: data.homeTeamColor, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name={data.homeTeamName}
            />
            <Line
              type="monotone"
              dataKey={data.awayTeamName}
              stroke={data.awayTeamColor}
              strokeWidth={3}
              dot={{ fill: data.awayTeamColor, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name={data.awayTeamName}
            />
            <ReferenceLine x="4" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'MT', fill: '#f59e0b', fontSize: 12 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SeriesAnalysis = ({ data }: { data: MatchData }) => {
  const penalties = data.events.filter((e) => e.type === 'Penalty Conceded');
  const cards = data.events.filter((e) => ['Yellow Card', 'Red Card', 'White Card'].includes(e.type));
  
  // Detect series: 3+ penalties in 10 min without card
  const detectSeries = (team: 'HOME' | 'AWAY') => {
    const teamPenalties = penalties.filter((p) => p.team === team).sort((a, b) => a.time - b.time);
    const series: Array<{
      startTime: number;
      endTime: number;
      count: number;
      severity: 'Modéré' | 'Élevé';
      penalties: MatchEvent[];
    }> = [];
    
    let i = 0;
    while (i < teamPenalties.length) {
      const startPenalty = teamPenalties[i];
      const windowEnd = startPenalty.time + 600; // 10 minutes
      const windowPenalties = teamPenalties.filter(
        (p) => p.time >= startPenalty.time && p.time <= windowEnd
      );
      
      // Check if any card in the window
      const cardsInWindow = cards.filter(
        (c) => c.team === team && c.time >= startPenalty.time && c.time <= windowEnd
      );
      
      if (windowPenalties.length >= 3 && cardsInWindow.length === 0) {
        series.push({
          startTime: startPenalty.time,
          endTime: windowPenalties[windowPenalties.length - 1].time,
          count: windowPenalties.length,
          severity: windowPenalties.length >= 5 ? 'Élevé' : 'Modéré',
          penalties: windowPenalties,
        });
        i += windowPenalties.length;
      } else {
        i++;
      }
    }
    
    return series;
  };

  const homeSeries = detectSeries('HOME');
  const awaySeries = detectSeries('AWAY');

  const severityColor = (severity: string) =>
    severity === 'Élevé' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10';

  const severityText = (severity: string) =>
    severity === 'Élevé' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        Détection des séries de pénalités
      </h3>
      <p className="text-slate-400 text-sm mb-4">
        Série: 3+ pénalitées en 10 minutes sans carton (jaune, blanc ou rouge)
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Home Team */}
        <div>
          <h4 className="text-sm font-medium text-blue-400 mb-3">{data.homeTeamName}</h4>
          {homeSeries.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Aucune série détectée</p>
          ) : (
            <div className="space-y-3">
              {homeSeries.map((series, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${severityColor(series.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${severityText(series.severity)}`}>
                      {series.severity}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {series.count} pénalitées
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(series.startTime)} - {formatTime(series.endTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Away Team */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">{data.awayTeamName}</h4>
          {awaySeries.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Aucune série détectée</p>
          ) : (
            <div className="space-y-3">
              {awaySeries.map((series, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${severityColor(series.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${severityText(series.severity)}`}>
                      {series.severity}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {series.count} pénalitées
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(series.startTime)} - {formatTime(series.endTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdvantageAnalysis = ({ data }: { data: MatchData }) => {
  const advantages = data.events.filter((e) => e.type === 'Advantage');
  
  const h1Advantages = advantages.filter((a) => getHalf(a.time) === 1);
  const h2Advantages = advantages.filter((a) => getHalf(a.time) === 2);
  
  // Types d'événements de score
  const scoreTypes = ['Penalty Try', 'Penalty Kick', 'Drop Goal', 'Try', 'Conversion'];
  
  // Catégories d'avantages
  const advantagePlusPlus: string[] = []; // Score dans les 30s
  const advantagePlus: string[] = [];     // Pas d'événement dans les 30s
  const advantageMinus: string[] = [];     // Événement non-score dans les 30s
  
  advantages.forEach((adv) => {
    const subsequentEvents = data.events.filter(
      (e) => e.time > adv.time && e.time <= adv.time + 30 && e.type !== 'Advantage'
    );
    
    // Vérifier si un des événements est un score
    const scoreEvent = subsequentEvents.find((e) => scoreTypes.includes(e.type));
    const hasNonScoreEvent = subsequentEvents.length > 0;
    
    if (scoreEvent) {
      advantagePlusPlus.push(adv.id);
    } else if (hasNonScoreEvent) {
      advantageMinus.push(adv.id);
    } else {
      advantagePlus.push(adv.id);
    }
  });

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-green-400" />
        Analyse des avantages
      </h3>
      
      {/* Ligne 1: Total et répartition par mi-temps */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-slate-100">{advantages.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total avantages</p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-400">{h1Advantages.length}</p>
          <p className="text-xs text-slate-400 mt-1">1ère Mi-temps</p>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{h2Advantages.length}</p>
          <p className="text-xs text-slate-400 mt-1">2ème Mi-temps</p>
        </div>
      </div>
      
      {/* Ligne 2: Les 3 catégories d'avantages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Advantage++ : Score dans les 30s */}
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Advantage++</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{advantagePlusPlus.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            Score généré &lt; 30s
            {advantages.length > 0 && (
              <span className="ml-2 text-emerald-400">
                ({Math.round((advantagePlusPlus.length / advantages.length) * 100)}%)
              </span>
            )}
          </p>
        </div>
        
        {/* Advantage+ : Pas d'événement dans les 30s */}
        <div className="bg-slate-600/30 border border-slate-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Minus className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold text-slate-400">Advantage+</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{advantagePlus.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            Aucun événement &gt; 30s
            {advantages.length > 0 && (
              <span className="ml-2 text-slate-400">
                ({Math.round((advantagePlus.length / advantages.length) * 100)}%)
              </span>
            )}
          </p>
        </div>
        
        {/* Advantage- : Événement non-score dans les 30s */}
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">Advantage-</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{advantageMinus.length}</p>
          <p className="text-xs text-slate-400 mt-1">
            Événement non-score &lt; 30s
            {advantages.length > 0 && (
              <span className="ml-2 text-amber-400">
                ({Math.round((advantageMinus.length / advantages.length) * 100)}%)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

const FilterPanel = ({
  filters,
  onFilterChange,
}: {
  filters: EventFilter;
  onFilterChange: (filters: EventFilter) => void;
}) => {
  const toggle = (key: keyof EventFilter) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const setTeam = (team: 'all' | 'home' | 'away') => {
    onFilterChange({ ...filters, team });
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
        <Filter className="w-4 h-4 text-blue-400" />
        Filtres des événements
      </h3>
      
      {/* Filtre par équipe */}
      <div className="mb-4">
        <h4 className="text-xs text-slate-400 mb-2">Équipe</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setTeam('all')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.team === 'all'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            Les 2
          </button>
          <button
            onClick={() => setTeam('home')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.team === 'home'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            Domicile
          </button>
          <button
            onClick={() => setTeam('away')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.team === 'away'
                ? 'bg-gray-500/20 text-gray-300 border border-gray-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            Visiteur
          </button>
        </div>
      </div>
      
      {/* Filtres par type */}
      <div>
        <h4 className="text-xs text-slate-400 mb-2">Type d'événement</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toggle('penalties')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.penalties
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            <Flag className="w-4 h-4" />
            Pénalités
          </button>
          <button
            onClick={() => toggle('yellowCards')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.yellowCards
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
            Cartons Jaunes
          </button>
          <button
            onClick={() => toggle('redCards')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.redCards
                ? 'bg-red-500/20 text-red-400 border border-red-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            <div className="w-4 h-4 bg-red-500 rounded-sm" />
            Cartons Rouges
          </button>
          <button
            onClick={() => toggle('whiteCards')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.whiteCards
                ? 'bg-white/20 text-white border border-white'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            <div className="w-4 h-4 bg-white border border-gray-400 rounded-sm" />
            Cartons Blancs
          </button>
          <button
            onClick={() => toggle('scores')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              filters.scores
                ? 'bg-green-500/20 text-green-400 border border-green-500'
                : 'bg-slate-700 text-slate-400 border border-slate-600'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Scores
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [filters, setFilters] = useState<EventFilter>({
    penalties: true,
    yellowCards: true,
    redCards: true,
    whiteCards: true,
    scores: true,
    team: 'all',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (matchData) {
      const dataStr = JSON.stringify(matchData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `match-${matchData.homeTeamName}-vs-${matchData.awayTeamName}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const kpis = useMemo(() => {
    if (!matchData) return null;
    
    const penalties = matchData.events.filter((e) => e.type === 'Penalty Conceded');
    const homePenalties = penalties.filter((p) => p.team === 'HOME').length;
    const awayPenalties = penalties.filter((p) => p.team === 'AWAY').length;
    const advantages = matchData.events.filter((e) => e.type === 'Advantage').length;
    
    return {
      homePenalties,
      awayPenalties,
      mostPenalized: homePenalties > awayPenalties ? matchData.homeTeamName : homePenalties < awayPenalties ? matchData.awayTeamName : 'Égalité',
      penaltyRatio: advantages > 0 ? `${penalties.length}/${advantages}` : 'N/A',
      totalPenalties: penalties.length,
      totalAdvantages: advantages,
    };
  }, [matchData]);

  const getScore = (team: 'HOME' | 'AWAY') => {
    if (!matchData) return 0;
    let score = 0;
    matchData.events.forEach((e) => {
      if (e.team === team) {
        if (e.type === 'Penalty Kick' || e.type === 'Penalty Try') score += e.points || 3;
        if (e.type === 'Try') score += 5;
        if (e.type === 'Conversion') score += 2;
        if (e.type === 'Drop Goal') score += 3;
      }
    });
    return score;
  };

  const getHalfTimeScore = (team: 'HOME' | 'AWAY') => {
    if (!matchData) return 0;
    const halfTimeEvent = matchData.events.find((e) => e.type === 'Half Time');
    if (!halfTimeEvent) return 0;
    
    let score = 0;
    matchData.events.forEach((e) => {
      if (e.time <= halfTimeEvent.time && e.team === team) {
        if (e.type === 'Penalty Kick' || e.type === 'Penalty Try') score += e.points || 3;
        if (e.type === 'Try') score += 5;
        if (e.type === 'Conversion') score += 2;
        if (e.type === 'Drop Goal') score += 3;
      }
    });
    return score;
  };

  if (!matchData) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-2xl mb-6">
              <Trophy className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-slate-100 mb-3">
              Rugby Match Analyzer
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Analysez les statistiques de vos matchs : pénalités, cartons, avantages et séries.
              Importez vos données JSON pour générer un tableau de bord complet.
            </p>
          </div>
          <DataInputPanel onDataLoaded={setMatchData} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  {matchData.homeTeamName} vs {matchData.awayTeamName}
                </h1>
                <p className="text-sm text-slate-400">
                  {matchData.matchLevel} • {matchData.matchDate} • Arbitre: {matchData.refereeName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
              <button
                onClick={() => setMatchData(null)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Nouveau
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Score Summary */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2"
                style={{ backgroundColor: matchData.homeTeamColor + '20', color: matchData.homeTeamColor }}
              >
                {getScore('HOME')}
              </div>
              <p className="text-sm text-slate-400">{matchData.homeTeamName}</p>
              <p className="text-xs text-slate-500">Mi-temps: {getHalfTimeScore('HOME')}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-2">Score Final</p>
              <p className="text-4xl font-bold text-slate-300">-</p>
            </div>
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-2"
                style={{ backgroundColor: matchData.awayTeamColor + '20', color: matchData.awayTeamColor }}
              >
                {getScore('AWAY')}
              </div>
              <p className="text-sm text-slate-400">{matchData.awayTeamName}</p>
              <p className="text-xs text-slate-500">Mi-temps: {getHalfTimeScore('AWAY')}</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            icon={Shield}
            label={`Pénalités ${matchData.homeTeamName}`}
            value={kpis?.homePenalties || 0}
            color="bg-blue-500/20"
          />
          <KPICard
            icon={Shield}
            label={`Pénalités ${matchData.awayTeamName}`}
            value={kpis?.awayPenalties || 0}
            color="bg-slate-500/20"
          />
          <KPICard
            icon={AlertTriangle}
            label="Équipe la plus pénalisée"
            value={kpis?.mostPenalized || '-'}
            color="bg-yellow-500/20"
          />
          <KPICard
            icon={Zap}
            label="Ratio Pénalités/Avantages"
            value={kpis?.penaltyRatio || '-'}
            color="bg-green-500/20"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PenaltyTable data={matchData} />
            <PenaltyPieChart data={matchData} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <FilterPanel filters={filters} onFilterChange={setFilters} />
            <VerticalTimeline 
              events={matchData.events}
              homeTeamName={matchData.homeTeamName}
              awayTeamName={matchData.awayTeamName}
              homeTeamColor={matchData.homeTeamColor}
              awayTeamColor={matchData.awayTeamColor}
              halfTimeMinute={matchData.events.find(e => e.type === 'Half Time')?.time || 2500}
              filters={filters}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PenaltyByPeriodChart data={matchData} />
          <CumulativePenaltyChart data={matchData} />
        </div>

        {/* Analysis Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SeriesAnalysis data={matchData} />
          <AdvantageAnalysis data={matchData} />
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-slate-800, .bg-slate-900 {
            background: white !important;
            border-color: #e5e7eb !important;
          }
          .bg-slate-700 {
            background: #f3f4f6 !important;
          }
          .text-slate-100, .text-slate-200 {
            color: black !important;
          }
          .text-slate-400, .text-slate-500 {
            color: #6b7280 !important;
          }
          .border-slate-700 {
            border-color: #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
}
