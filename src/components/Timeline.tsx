interface Event {
  id: string;
  time: number;
  type: string;
  team?: string;
  detail?: string;
  points?: number;
}

interface TeamData {
  name: string;
  color: string;
}

interface TimelineProps {
  events: Event[];
  homeTeam: TeamData;
  awayTeam: TeamData;
  filters: {
    penalties: boolean;
    yellowCards: boolean;
    redCards: boolean;
    whiteCards: boolean;
    scores: boolean;
  };
  firstHalfEnd: number;
  matchDuration: number;
  homeScore: { half1: number; half2: number; total: number };
  awayScore: { half1: number; half2: number; total: number };
}

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
  if (type === 'Penalty Try') return '🏉';
  if (type === 'Penalty Kick') return '👟';
  if (type === 'Drop Goal') return '🎯';
  if (type === 'Try') return '✅';
  if (type === 'Conversion') return '🎯';
  return '📋';
};

const getEventColor = (type: string, teamColor?: string) => {
  if (type === 'Penalty Conceded') return '#f59e0b';
  if (type === 'Yellow Card') return '#eab308';
  if (type === 'Red Card') return '#ef4444';
  if (type === 'White Card') return '#d1d5db';
  if (type === 'Penalty Try') return teamColor || '#22c55e';
  if (type === 'Penalty Kick') return teamColor || '#22c55e';
  if (type === 'Drop Goal') return teamColor || '#22c55e';
  if (type === 'Try') return teamColor || '#22c55e';
  if (type === 'Conversion') return teamColor || '#22c55e';
  return '#6b7280';
};

export default function Timeline({
  events,
  homeTeam,
  awayTeam,
  filters,
  firstHalfEnd,
  matchDuration,
  homeScore,
  awayScore,
}: TimelineProps) {
  // Filtrer les événements
  const filteredEvents = events.filter((event) => {
    if (event.type === 'Penalty Conceded' && !filters.penalties) return false;
    if (event.type === 'Yellow Card' && !filters.yellowCards) return false;
    if (event.type === 'Red Card' && !filters.redCards) return false;
    if (event.type === 'White Card' && !filters.whiteCards) return false;
    if (
      ['Penalty Try', 'Penalty Kick', 'Drop Goal', 'Try', 'Conversion'].includes(event.type) &&
      !filters.scores
    )
      return false;
    if (['Half Time', 'Full Time', 'Supervisor Alert', 'Advantage', 'Scrum', 'Start', 'Stop'].includes(event.type))
      return false;
    return true;
  });

  // Séparer les événements par équipe
  const homeEvents = filteredEvents
    .filter((e) => e.team === 'HOME')
    .sort((a, b) => a.time - b.time);
  const awayEvents = filteredEvents
    .filter((e) => e.team === 'AWAY')
    .sort((a, b) => a.time - b.time);

  // Calculer l'échelle de temps
  const maxTime = Math.max(matchDuration, ...events.map((e) => e.time));
  const timeToPosition = (time: number) => (time / maxTime) * 100;

  // Générer les marqueurs de temps
  const timeMarkers = [];
  for (let i = 0; i <= Math.ceil(maxTime / 600); i++) {
    const time = i * 600;
    if (time <= maxTime) {
      timeMarkers.push({ time, label: formatTime(time) });
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span>📅</span> Timeline des Événements
        </h2>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => (
            <button
              key={key}
              onClick={() => {}}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                value
                  ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                  : 'bg-gray-100 text-gray-500 border-2 border-transparent'
              }`}
            >
              {key === 'penalties' && '⚠️ Pénalités'}
              {key === 'yellowCards' && '🟨 Cartons Jaunes'}
              {key === 'redCards' && '🟥 Cartons Rouges'}
              {key === 'whiteCards' && '⬜ Cartons Blancs'}
              {key === 'scores' && '🏉 Scores'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline principale */}
      <div className="relative mt-8">
        {/* En-tête avec noms des équipes et scores */}
        <div className="grid grid-cols-3 mb-4">
          <div className="text-right pr-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold"
              style={{ backgroundColor: homeTeam.color }}
            >
              <span>{homeTeam.name}</span>
              <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-sm">
                {homeScore.total}
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 font-medium">SCORE</div>
          </div>
          <div className="text-left pl-4">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-bold"
              style={{ backgroundColor: awayTeam.color }}
            >
              <span className="bg-white text-gray-800 px-2 py-0.5 rounded text-sm">
                {awayScore.total}
              </span>
              <span>{awayTeam.name}</span>
            </div>
          </div>
        </div>

        {/* Zone domicile - événements au-dessus de la ligne */}
        <div className="mb-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
            <span style={{ color: homeTeam.color }}>●</span>
            {homeTeam.name}
          </div>
          <div className="relative h-24">
            {/* Ligne du haut */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-30" />
            
            {/* Ligne de temps centrale */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -translate-y-1/2 rounded-full" />
            
            {/* Marqueur mi-temps */}
            <div
              className="absolute top-1/2 w-1 h-8 bg-yellow-500 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
              style={{ left: `${timeToPosition(firstHalfEnd)}%` }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-2 py-1 rounded font-bold whitespace-nowrap">
                MT
              </div>
            </div>

            {/* Événements domicile */}
            <div className="absolute top-0 left-0 right-0 h-1/2">
              {homeEvents.map((event, index) => {
                const position = timeToPosition(event.time);
                const isAbove = index % 2 === 0;
                return (
                  <div
                    key={event.id}
                    className="absolute transform -translate-x-1/2 group"
                    style={{ left: `${position}%`, [isAbove ? 'bottom' : 'top']: '50%' }}
                  >
                    {/* Point sur la ligne */}
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 absolute"
                      style={{
                        backgroundColor: getEventColor(event.type, homeTeam.color),
                        bottom: isAbove ? 0 : 'auto',
                        top: isAbove ? 'auto' : 0,
                        transform: 'translateX(-50%) translateY(50%)',
                      }}
                    />
                    {/* Événement */}
                    <div
                      className={`absolute ${isAbove ? 'bottom-5' : 'top-5'} left-1/2 -translate-x-1/2`}
                    >
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium shadow-lg whitespace-nowrap cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: getEventColor(event.type, homeTeam.color) }}
                      >
                        <div className="flex items-center gap-1">
                          <span>{getEventIcon(event.type)}</span>
                          <span className="font-bold">{formatTime(event.time)}</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
                          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                            <div className="font-bold">{event.type}</div>
                            {event.detail && <div>{event.detail}</div>}
                            {event.points && <div className="text-green-400">+{event.points} pts</div>}
                            <div className="text-gray-400">{formatTime(event.time)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ligne centrale avec времени */}
        <div className="relative my-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 -translate-y-1/2 rounded-full" />
          
          {/* Marqueurs de temps */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-2">
            {timeMarkers.map(({ time, label }) => (
              <div
                key={time}
                className="relative"
                style={{ left: `${timeToPosition(time)}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-3 bg-gray-400 mx-auto" />
                <div className="text-xs text-gray-500 mt-1 -translate-x-1/2">{label}</div>
              </div>
            ))}
          </div>

          {/* Début match */}
          <div className="absolute left-0 -translate-x-1/2">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
            <div className="text-xs text-green-600 font-bold mt-1 -translate-x-1/2">KO</div>
          </div>

          {/* Mi-temps */}
          <div
            className="absolute bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10"
            style={{ left: `${timeToPosition(firstHalfEnd)}%`, transform: 'translate(-50%, -100%)' }}
          >
            🟡 MT
            <div className="text-[10px] font-normal opacity-80">
              {homeScore.half1} - {awayScore.half1}
            </div>
          </div>

          {/* Fin match */}
          <div
            className="absolute right-0 translate-x-1/2"
            style={{ left: `${timeToPosition(matchDuration)}%`, transform: 'translateX(50%)' }}
          >
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
            <div className="text-xs text-red-600 font-bold mt-1 translate-x-1/2">FT</div>
          </div>
        </div>

        {/* Zone visiteur - événements en-dessous de la ligne */}
        <div className="mt-2">
          <div className="relative h-24">
            {/* Ligne de temps centrale */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -translate-y-1/2 rounded-full" />
            
            {/* Marqueur mi-temps */}
            <div
              className="absolute top-1/2 w-1 h-8 bg-yellow-500 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
              style={{ left: `${timeToPosition(firstHalfEnd)}%` }}
            />

            {/* Événements visiteur */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2">
              {awayEvents.map((event, index) => {
                const position = timeToPosition(event.time);
                const isAbove = index % 2 === 0;
                return (
                  <div
                    key={event.id}
                    className="absolute transform -translate-x-1/2 group"
                    style={{ left: `${position}%`, [isAbove ? 'bottom' : 'top']: '50%' }}
                  >
                    {/* Point sur la ligne */}
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 absolute"
                      style={{
                        backgroundColor: getEventColor(event.type, awayTeam.color),
                        bottom: isAbove ? 0 : 'auto',
                        top: isAbove ? 'auto' : 0,
                        transform: 'translateX(-50%) translateY(-50%)',
                      }}
                    />
                    {/* Événement */}
                    <div
                      className={`absolute ${isAbove ? 'bottom-5' : 'top-5'} left-1/2 -translate-x-1/2`}
                    >
                      <div
                        className="px-2 py-1 rounded-lg text-white text-xs font-medium shadow-lg whitespace-nowrap cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: getEventColor(event.type, awayTeam.color) }}
                      >
                        <div className="flex items-center gap-1">
                          <span>{getEventIcon(event.type)}</span>
                          <span className="font-bold">{formatTime(event.time)}</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20">
                          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                            <div className="font-bold">{event.type}</div>
                            {event.detail && <div>{event.detail}</div>}
                            {event.points && <div className="text-green-400">+{event.points} pts</div>}
                            <div className="text-gray-400">{formatTime(event.time)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2 flex items-center gap-2">
            <span style={{ color: awayTeam.color }}>●</span>
            {awayTeam.name}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 justify-center text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Pénalité</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span>Carton Jaune</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span>Carton Rouge</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Carton Blanc</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span>Score</span>
            </div>
          </div>
        </div>

        {/* Message si aucun événement */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <div>Aucun événement à afficher avec les filtres actuels</div>
          </div>
        )}
      </div>
    </div>
  );
}
