import { useState } from 'react';

interface Event {
  id: string;
  time: number;
  type: string;
  team?: 'HOME' | 'AWAY';
  detail?: string;
  points?: number;
}

interface MatchData {
  events: Event[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamColor: string;
  awayTeamColor: string;
}

interface EventFilter {
  penalties: boolean;
  yellowCards: boolean;
  redCards: boolean;
  whiteCards: boolean;
  scores: boolean;
}

interface TimelineProps {
  data: MatchData;
  filters: EventFilter;
}

type TeamFilter = 'ALL' | 'HOME' | 'AWAY';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getEventIcon = (type: string) => {
  if (type === 'Penalty Conceded') return '⚠️';
  if (type === 'Yellow Card') return '🟨';
  if (type === 'Red Card') return '🟥';
  if (type === 'White Card') return '⬜';
  if (type === 'Penalty Try') return 'TRY';
  if (type === 'Penalty Kick') return 'PK';
  if (type === 'Drop Goal') return 'DG';
  if (type === 'Try') return 'TRY';
  if (type === 'Conversion') return 'C';
  return '•';
};

const getEventColor = (type: string, teamColor?: string) => {
  if (type === 'Penalty Conceded') return '#f59e0b';
  if (type === 'Yellow Card') return '#eab308';
  if (type === 'Red Card') return '#ef4444';
  if (type === 'White Card') return '#d1d5db';
  if (['Penalty Try', 'Penalty Kick', 'Drop Goal', 'Try', 'Conversion'].includes(type)) 
    return teamColor || '#22c55e';
  return '#6b7280';
};

export default function Timeline({ data, filters }: TimelineProps) {
  const [localFilters, setLocalFilters] = useState<EventFilter>(filters);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('ALL');

  const toggleFilter = (key: keyof EventFilter) => {
    setLocalFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtrer les événements selon les filtres locaux
  const filteredEvents = data.events.filter((event) => {
    if (event.type === 'Penalty Conceded' && !localFilters.penalties) return false;
    if (event.type === 'Yellow Card' && !localFilters.yellowCards) return false;
    if (event.type === 'Red Card' && !localFilters.redCards) return false;
    if (event.type === 'White Card' && !localFilters.whiteCards) return false;
    if (
      ['Penalty Try', 'Penalty Kick', 'Drop Goal', 'Try', 'Conversion'].includes(event.type) &&
      !localFilters.scores
    )
      return false;
    if (['Half Time', 'Full Time', 'Supervisor Alert', 'Advantage', 'Scrum', 'Start', 'Stop',
         'Lineout', 'Throw Forward', 'Throw Straight', 'Not Straight', 'Loss of Containment',
         'Kicked Out', 'Over Carry', 'Collapsed Maul', 'Stealing', 'Incomplete', ' Maul', 
         'Foul Play', 'Dissent', 'Technical'].includes(event.type))
      return false;
    return true;
  });

  // Appliquer le filtre équipe
  const teamFilteredEvents = filteredEvents.filter((event) => {
    if (teamFilter === 'ALL') return true;
    return event.team === teamFilter;
  });

  // Calculer les scores
  const getScoreAtTime = (time: number, team: 'HOME' | 'AWAY') => {
    let score = 0;
    data.events.forEach((e) => {
      if (e.time <= time && e.team === team) {
        if (e.type === 'Penalty Kick' || e.type === 'Penalty Try') score += e.points || 3;
        if (e.type === 'Try') score += 5;
        if (e.type === 'Conversion') score += 2;
        if (e.type === 'Drop Goal') score += 3;
      }
    });
    return score;
  };

  const halfTimeEvent = data.events.find((e) => e.type === 'Half Time');
  const fullTimeEvent = data.events.find((e) => e.type === 'Full Time');
  const halfTime = halfTimeEvent?.time || 2505;
  const fullTime = fullTimeEvent?.time || 4864;

  const homeScoreAtHalf = getScoreAtTime(halfTime, 'HOME');
  const awayScoreAtHalf = getScoreAtTime(halfTime, 'AWAY');
  const homeScoreFinal = getScoreAtTime(fullTime, 'HOME');
  const awayScoreFinal = getScoreAtTime(fullTime, 'AWAY');

  // Séparer les événements par équipe
  const homeEvents = teamFilteredEvents
    .filter((e) => e.team === 'HOME')
    .sort((a, b) => a.time - b.time);
  const awayEvents = teamFilteredEvents
    .filter((e) => e.team === 'AWAY')
    .sort((a, b) => a.time - b.time);

  // Calculer l'échelle de temps
  const maxTime = Math.max(fullTime, ...data.events.map((e) => e.time));
  const timeToPosition = (time: number) => (time / maxTime) * 100;

  // Générer les marqueurs de temps
  const timeMarkers = [];
  for (let i = 0; i <= Math.ceil(maxTime / 600); i++) {
    const time = i * 600;
    if (time <= maxTime) {
      timeMarkers.push({ time, label: formatTime(time) });
    }
  }

  // Définir les couleurs des équipes
  const homeColor = data.homeTeamColor || '#3b82f6';
  const awayColor = data.awayTeamColor || '#6b7280';

  // Rendre un seul événement à une position
  const renderEvent = (event: Event, isHome: boolean, allEventsInRow: Event[]) => {
    const position = timeToPosition(event.time);
    const teamColor = isHome ? homeColor : awayColor;
    const rowIndex = allEventsInRow.findIndex(e => e.id === event.id);
    const offsetMultiplier = Math.floor(rowIndex / 3); // Permettre jusqu'à 3 events par ligne
    const offset = offsetMultiplier * 28; // Espacement vertical
    
    return (
      <div
        key={event.id}
        className="absolute transform -translate-x-1/2 group"
        style={{ 
          left: `${position}%`,
          top: isHome ? `${-offset - 40}px` : `${offset + 40}px`,
        }}
      >
        {/* Badge de l'événement */}
        <div
          className="px-2 py-1 rounded-lg text-white text-xs font-bold shadow-lg whitespace-nowrap cursor-pointer hover:scale-110 transition-transform flex items-center gap-1"
          style={{ backgroundColor: getEventColor(event.type, teamColor) }}
        >
          <span className="text-[10px]">{getEventIcon(event.type)}</span>
          <span>{formatTime(event.time)}</span>
          {event.detail && (
            <span className="hidden lg:inline text-[10px] opacity-80">• {event.detail}</span>
          )}
          {event.points && (
            <span className="bg-white text-gray-800 px-1 rounded text-[10px] font-bold">+{event.points}</span>
          )}
        </div>
        
        {/* Ligne vers la timeline */}
        <div 
          className="w-px h-4 mx-auto"
          style={{ backgroundColor: getEventColor(event.type, teamColor), opacity: 0.5 }}
        />
        
        {/* Point sur la ligne */}
        <div
          className="w-3 h-3 rounded-full border-2 border-white shadow-md mx-auto"
          style={{ backgroundColor: getEventColor(event.type, teamColor) }}
        />
        
        {/* Tooltip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <div className="font-bold">{event.type}</div>
            {event.detail && <div className="text-gray-300">{event.detail}</div>}
            {event.points && <div className="text-green-400">+{event.points} pts</div>}
            <div className="text-gray-400">{formatTime(event.time)}</div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      {/* En-tête avec noms des équipes et scores */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-sm"
          style={{ backgroundColor: homeColor }}
        >
          <span>{data.homeTeamName}</span>
          <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs">{homeScoreFinal}</span>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 font-medium">Score Final</div>
        </div>
        
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white font-bold text-sm"
          style={{ backgroundColor: awayColor }}
        >
          <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs">{awayScoreFinal}</span>
          <span>{data.awayTeamName}</span>
        </div>
      </div>

      {/* Filtres multi-sélections */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => toggleFilter('penalties')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            localFilters.penalties
              ? 'bg-amber-100 text-amber-700 border-2 border-amber-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
        >
          ⚠️ Pénalités
        </button>
        <button
          onClick={() => toggleFilter('yellowCards')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            localFilters.yellowCards
              ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
        >
          🟨 Jaunes
        </button>
        <button
          onClick={() => toggleFilter('redCards')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            localFilters.redCards
              ? 'bg-red-100 text-red-700 border-2 border-red-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
        >
          🟥 Rouges
        </button>
        <button
          onClick={() => toggleFilter('whiteCards')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            localFilters.whiteCards
              ? 'bg-gray-200 text-gray-700 border-2 border-gray-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
        >
          ⬜ Blancs
        </button>
        <button
          onClick={() => toggleFilter('scores')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            localFilters.scores
              ? 'bg-green-100 text-green-700 border-2 border-green-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
        >
          🏉 Scores
        </button>

        {/* Séparateur */}
        <div className="w-px h-8 bg-gray-300 mx-2" />

        {/* Filtre par équipe */}
        <button
          onClick={() => setTeamFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            teamFilter === 'ALL'
              ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
        >
          🏠 Les 2
        </button>
        <button
          onClick={() => setTeamFilter('HOME')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            teamFilter === 'HOME'
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
          style={{ borderColor: teamFilter === 'HOME' ? homeColor : undefined }}
        >
          {data.homeTeamName}
        </button>
        <button
          onClick={() => setTeamFilter('AWAY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            teamFilter === 'AWAY'
              ? 'bg-gray-100 text-gray-700 border-2 border-gray-400'
              : 'bg-gray-100 text-gray-500 border-2 border-transparent'
          }`}
          style={{ borderColor: teamFilter === 'AWAY' ? awayColor : undefined }}
        >
          {data.awayTeamName}
        </button>
      </div>

      {/* Timeline principale */}
      <div className="relative pt-20 pb-24">
        {/* Événements domicile - AU-DESSUS de la ligne */}
        {(teamFilter === 'ALL' || teamFilter === 'HOME') && (
          <div className="absolute left-0 right-0 bottom-1/2 translate-y-4 pointer-events-none">
            <div className="relative h-full">
              {/* Label équipe domicile */}
              <div 
                className="absolute left-2 top-0 text-xs font-bold text-white px-2 py-0.5 rounded"
                style={{ backgroundColor: homeColor }}
              >
                {data.homeTeamName} ({homeEvents.length})
              </div>
              
              {/* Contenu des événements */}
              <div className="relative h-20 pt-6">
                {homeEvents.map((event) => renderEvent(event, true, homeEvents))}
              </div>
            </div>
          </div>
        )}

        {/* Ligne centrale avec marqueurs */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2">
          {/* Fond de la timeline */}
          <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-200 -translate-y-1/2 rounded-full" />
          
          {/* Zone 1ère mi-temps */}
          <div 
            className="absolute top-1/2 left-0 h-3 bg-green-400 -translate-y-1/2 rounded-l-full opacity-40"
            style={{ width: `${timeToPosition(halfTime)}%` }}
          />
          
          {/* Zone 2ème mi-temps */}
          <div 
            className="absolute top-1/2 bg-red-400 -translate-y-1/2 rounded-r-full opacity-40"
            style={{ left: `${timeToPosition(halfTime)}%`, width: `${timeToPosition(fullTime - halfTime)}%` }}
          />

          {/* Ligne principale */}
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-400 -translate-y-1/2 rounded-full" />

          {/* Marqueurs de temps */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2">
            {timeMarkers.map(({ time, label }) => (
              <div
                key={time}
                className="relative"
                style={{ left: `${timeToPosition(time)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-px h-4 bg-gray-400 mx-auto -translate-y-1" />
                <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Début match */}
          <div 
            className="absolute w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg z-10 -translate-y-1/2"
            style={{ left: '0%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
              KO
            </div>
          </div>

          {/* Marqueur mi-temps */}
          <div
            className="absolute flex flex-col items-center z-10 -translate-y-1/2"
            style={{ left: `${timeToPosition(halfTime)}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="bg-yellow-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg">
              MT
            </div>
            <div className="text-[10px] text-yellow-600 font-bold mt-0.5">
              {homeScoreAtHalf}-{awayScoreAtHalf}
            </div>
          </div>

          {/* Marqueur mi-temps ligne verticale */}
          <div
            className="absolute w-0.5 h-10 bg-yellow-500 rounded-full shadow-lg z-10 -translate-x-1/2"
            style={{ left: `${timeToPosition(halfTime)}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
          />

          {/* Fin match */}
          <div 
            className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg z-10 -translate-y-1/2"
            style={{ left: `${timeToPosition(fullTime)}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
              FT
            </div>
          </div>
        </div>

        {/* Événements visiteur - EN-DESSOUS de la ligne */}
        {(teamFilter === 'ALL' || teamFilter === 'AWAY') && (
          <div className="absolute left-0 right-0 top-1/2 translate-y-4 pointer-events-none">
            <div className="relative h-full">
              {/* Contenu des événements */}
              <div className="relative h-20 pb-6">
                {awayEvents.map((event) => renderEvent(event, false, awayEvents))}
              </div>
              
              {/* Label équipe visiteur */}
              <div 
                className="absolute left-2 bottom-0 text-xs font-bold text-white px-2 py-0.5 rounded"
                style={{ backgroundColor: awayColor }}
              >
                {data.awayTeamName} ({awayEvents.length})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 justify-center text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Pénalité</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>Carton Jaune</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Carton Rouge</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span>Carton Blanc</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span>Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}
