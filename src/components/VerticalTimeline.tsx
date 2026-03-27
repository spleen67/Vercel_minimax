import React, { useMemo, useState } from 'react';
import { Clock, AlertTriangle, Trophy, Flag } from 'lucide-react';

interface Event {
  id: string;
  time: number;
  type: string;
  team?: string;
  detail?: string;
  points?: number;
}

interface VerticalTimelineProps {
  events: Event[];
  homeTeamName: string;
  awayTeamName: string;
  homeTeamColor: string;
  awayTeamColor: string;
  halfTimeMinute: number;
  filters: {
    penalties: boolean;
    yellowCards: boolean;
    redCards: boolean;
    whiteCards: boolean;
    scores: boolean;
    team: 'all' | 'home' | 'away';
  };
}

const EVENT_TYPES = ['Penalty Conceded', 'Yellow Card', 'Red Card', 'White Card', 'Penalty Try', 'Penalty Kick', 'Drop Goal', 'Try', 'Conversion'];

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({
  events,
  homeTeamName,
  awayTeamName,
  homeTeamColor,
  awayTeamColor,
  halfTimeMinute,
  filters
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<Event | null>(null);

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (!EVENT_TYPES.includes(event.type)) return false;
      
      const isPenalty = event.type === 'Penalty Conceded';
      const isYellow = event.type === 'Yellow Card';
      const isRed = event.type === 'Red Card';
      const isWhite = event.type === 'White Card';
      const isScore = ['Penalty Try', 'Penalty Kick', 'Drop Goal', 'Try', 'Conversion'].includes(event.type);

      if (isPenalty && !filters.penalties) return false;
      if (isYellow && !filters.yellowCards) return false;
      if (isRed && !filters.redCards) return false;
      if (isWhite && !filters.whiteCards) return false;
      if (isScore && !filters.scores) return false;
      if (filters.team === 'home' && event.team !== 'HOME') return false;
      if (filters.team === 'away' && event.team !== 'AWAY') return false;

      return true;
    });
  }, [events, filters]);

  // Séparer les événements par équipe
  const homeEvents = useMemo(() => {
    return filteredEvents
      .filter(e => e.team === 'HOME')
      .sort((a, b) => a.time - b.time);
  }, [filteredEvents]);

  const awayEvents = useMemo(() => {
    return filteredEvents
      .filter(e => e.team === 'AWAY')
      .sort((a, b) => a.time - b.time);
  }, [filteredEvents]);

  // Trouver le temps exact de la mi-temps depuis l'événement "Half Time"
  const halfTimeEventTime = useMemo(() => {
    const htEvent = events.find(e => e.type === 'Half Time');
    return htEvent?.time || halfTimeMinute;
  }, [events, halfTimeMinute]);

  // Max time pour calculer les hauteurs
  const maxTime = useMemo(() => {
    const fullTime = events.find(e => e.type === 'Full Time');
    // Utiliser au minimum 2x la mi-temps pour avoir assez d'espace
    return fullTime ? fullTime.time : halfTimeEventTime * 2 + 500;
  }, [events, halfTimeEventTime]);

  // Marqueur de position en pourcentage
  const getTopPosition = (time: number) => {
    return (time / maxTime) * 100;
  };

  // Position de la mi-temps en pourcentage (basée sur l'événement "Half Time")
  const halfTimePosition = (halfTimeEventTime / maxTime) * 100;

  // Calculer le score final
  const scores = useMemo(() => {
    let home = 0, away = 0;
    events.forEach(e => {
      if (e.type === 'Try') { e.team === 'HOME' ? home += 5 : away += 5; }
      if (e.type === 'Conversion') { e.team === 'HOME' ? home += 2 : away += 2; }
      if (e.type === 'Penalty Try') { e.team === 'HOME' ? home += (e.points || 7) : away += (e.points || 7); }
      if (e.type === 'Penalty Kick' || e.type === 'Drop Goal') { e.team === 'HOME' ? home += (e.points || 3) : away += (e.points || 3); }
    });
    return { home, away };
  }, [events]);

  // Score à la mi-temps (basé sur l'événement "Half Time")
  const halfTimeScores = useMemo(() => {
    let home = 0, away = 0;
    events.forEach(e => {
      // Utiliser le temps exact de l'événement "Half Time"
      if (e.time > halfTimeEventTime) return;
      if (e.type === 'Try') { e.team === 'HOME' ? home += 5 : away += 5; }
      if (e.type === 'Conversion') { e.team === 'HOME' ? home += 2 : away += 2; }
      if (e.type === 'Penalty Try') { e.team === 'HOME' ? home += (e.points || 7) : away += (e.points || 7); }
      if (e.type === 'Penalty Kick' || e.type === 'Drop Goal') { e.team === 'HOME' ? home += (e.points || 3) : away += (e.points || 3); }
    });
    return { home, away };
  }, [events, halfTimeEventTime]);

  const getEventIcon = (type: string) => {
    if (type === 'Penalty Conceded') return <AlertTriangle size={14} />;
    if (type === 'Yellow Card') return <div className="w-3 h-4 bg-yellow-400 rounded-sm flex-shrink-0" />;
    if (type === 'Red Card') return <div className="w-3 h-4 bg-red-500 rounded-sm flex-shrink-0" />;
    if (type === 'White Card') return <div className="w-3 h-4 bg-gray-200 border border-gray-400 rounded-sm flex-shrink-0" />;
    if (['Penalty Try', 'Try'].includes(type)) return <Trophy size={14} />;
    if (['Penalty Kick', 'Drop Goal', 'Conversion'].includes(type)) return <Flag size={14} />;
    return <Clock size={14} />;
  };

  const getEventBgColor = (type: string) => {
    if (type === 'Penalty Conceded') return 'bg-amber-50 border-amber-300 hover:bg-amber-100';
    if (type === 'Yellow Card') return 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100';
    if (type === 'Red Card') return 'bg-red-50 border-red-300 hover:bg-red-100';
    if (type === 'White Card') return 'bg-gray-50 border-gray-300 hover:bg-gray-100';
    if (['Penalty Try', 'Try'].includes(type)) return 'bg-green-50 border-green-300 hover:bg-green-100';
    if (['Penalty Kick', 'Drop Goal', 'Conversion'].includes(type)) return 'bg-blue-50 border-blue-300 hover:bg-blue-100';
    return 'bg-gray-50 border-gray-300';
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}'${sec > 0 ? `${sec}` : ''}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
      {/* Header avec scores */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeTeamColor }} />
          <span className="font-bold text-white text-sm">{homeTeamName}</span>
          <span className="text-2xl font-bold text-white">{scores.home}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-xs text-purple-300 font-medium">MI-TEMPS</div>
          <div className="text-lg font-bold text-white">{halfTimeScores.home} - {halfTimeScores.away}</div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white">{scores.away}</span>
          <span className="font-bold text-white text-sm">{awayTeamName}</span>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayTeamColor }} />
        </div>
      </div>

      {/* Contenu de la Timeline */}
      <div className="p-4">
        {/* Ligne centrale avec marqueurs de temps */}
        <div className="relative flex">
          {/* Colonne gauche - HOME */}
          <div className="w-1/2 pr-4">
            {homeEvents.length > 0 ? (
              <div className="space-y-1">
                {homeEvents.map((event) => {
                  const top = getTopPosition(event.time);
                  return (
                    <div
                      key={event.id}
                      className="relative"
                      style={{ height: '40px', marginTop: top > 0 ? `${top}%` : '0' }}
                    >
                      {/* Ligne vers la timeline */}
                      <div 
                        className="absolute right-0 top-1/2 h-0.5 w-6"
                        style={{ backgroundColor: homeTeamColor }}
                      />
                      
                      {/* Badge */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex-1 p-2 rounded-lg border ${getEventBgColor(event.type)} transition-colors cursor-pointer`}
                          onMouseEnter={() => setHoveredEvent(event)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <span className="font-bold text-xs text-gray-700">{formatTime(event.time)}</span>
                            <span className="text-xs text-gray-600 truncate flex-1">
                              {event.type === 'Penalty Conceded' ? (event.detail || 'Pénalité') : event.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Point sur la timeline */}
                      <div 
                        className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white z-10 shadow-sm"
                        style={{ backgroundColor: homeTeamColor }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8 text-sm">
                Aucun événement {filters.team === 'home' ? homeTeamName : ''}
              </div>
            )}
          </div>

          {/* Colonne centrale - Timeline */}
          <div className="relative w-12 flex-shrink-0">
            {/* Ligne */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-300 h-full" />
            
            {/* Debut */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10 shadow-md">
              <span className="text-white text-xs font-bold">K</span>
            </div>
            
            {/* Mi-temps */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center z-10 shadow-md"
              style={{ top: `${halfTimePosition}%` }}
            >
              <span className="text-white text-xs font-bold">MT</span>
            </div>
            
            {/* Fin */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-md"
              style={{ top: 'calc(100% - 32px)' }}
            >
              <span className="text-white text-xs font-bold">F</span>
            </div>
          </div>

          {/* Colonne droite - AWAY */}
          <div className="w-1/2 pl-4">
            {awayEvents.length > 0 ? (
              <div className="space-y-1">
                {awayEvents.map((event) => {
                  const top = getTopPosition(event.time);
                  return (
                    <div
                      key={event.id}
                      className="relative"
                      style={{ height: '40px', marginTop: top > 0 ? `${top}%` : '0' }}
                    >
                      {/* Ligne vers la timeline */}
                      <div 
                        className="absolute left-0 top-1/2 h-0.5 w-6"
                        style={{ backgroundColor: awayTeamColor }}
                      />
                      
                      {/* Badge */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex-1 p-2 rounded-lg border ${getEventBgColor(event.type)} transition-colors cursor-pointer`}
                          onMouseEnter={() => setHoveredEvent(event)}
                          onMouseLeave={() => setHoveredEvent(null)}
                        >
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <span className="font-bold text-xs text-gray-700">{formatTime(event.time)}</span>
                            <span className="text-xs text-gray-600 truncate flex-1">
                              {event.type === 'Penalty Conceded' ? (event.detail || 'Pénalité') : event.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Point sur la timeline */}
                      <div 
                        className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white z-10 shadow-sm"
                        style={{ backgroundColor: awayTeamColor }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8 text-sm">
                Aucun événement {filters.team === 'away' ? awayTeamName : ''}
              </div>
            )}
          </div>
        </div>

        {/* Infobulle au survol */}
        {hoveredEvent && (
          <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold">{hoveredEvent.team === 'HOME' ? homeTeamName : awayTeamName}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{formatTime(hoveredEvent.time)}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-800">{hoveredEvent.detail || hoveredEvent.type}</span>
            </div>
          </div>
        )}

        {/* Résumé */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={12} />
            <span>{filteredEvents.filter(e => e.type === 'Penalty Conceded').length}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-600">
            <div className="w-2 h-3 bg-yellow-400 rounded-sm" />
            <span>{filteredEvents.filter(e => e.type === 'Yellow Card').length}</span>
          </div>
          <div className="flex items-center gap-1 text-red-600">
            <div className="w-2 h-3 bg-red-500 rounded-sm" />
            <span>{filteredEvents.filter(e => e.type === 'Red Card').length}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <div className="w-2 h-3 bg-gray-300 border border-gray-400 rounded-sm" />
            <span>{filteredEvents.filter(e => e.type === 'White Card').length}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Trophy size={12} />
            <span>{filteredEvents.filter(e => ['Try', 'Penalty Try', 'Penalty Kick', 'Drop Goal', 'Conversion'].includes(e.type)).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerticalTimeline;
