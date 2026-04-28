import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC, type PointerEvent as ReactPointerEvent } from 'react';
import type { MatchData, MatchEvent, VolleyballSet } from '../types';
import { Doughnut, Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
  type TooltipItem,
} from 'chart.js';
import { Download, RefreshCw, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../languages/LanguageContext';
import { serializeMatch } from '../matchPersistence';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

const ACTION_COLORS: Record<string, string> = {
  ace: '#4ade80',
  spike_kill: '#60a5fa',
  spike_tip: '#0ea5e9',
  block: '#a78bfa',
  block_out: '#2dd4bf',
  set_dump: '#facc15',
  opponent_error: '#818cf8',
  serve_miss: '#ef4444',
  spike_kill_against: '#f87171',
  spike_tip_against: '#f43f5e',
  block_against: '#fb923c',
  block_out_against: '#f472b6',
  missed_free_ball: '#fbbf24',
  ball_into_net: '#fb7185',
  ball_out_of_bounds: '#c084fc',
  bad_set: '#38bdf8',
};

const SCORING_ORDER = ['ace', 'spike_kill', 'spike_tip', 'block', 'block_out', 'set_dump', 'opponent_error'] as const;
const ERROR_ORDER = [
  'serve_miss',
  'spike_kill_against',
  'spike_tip_against',
  'block_against',
  'block_out_against',
  'missed_free_ball',
  'ball_into_net',
  'ball_out_of_bounds',
  'bad_set'
] as const;

const SET_TIMELINE_WINDOW = 10;

type GraphMode = 'full' | 'precision';

interface Props {
  match: MatchData;
  onReset: () => void;
  onUpdate: (updated: MatchData) => void;
}

interface TimelinePoint {
  x: number;
  y: number;
  eventIndex: number | null;
}

interface SetTimelineEntry {
  event: MatchEvent;
  pointNumber: number;
  ourScore: number;
  opponentScore: number;
}

interface SetTimelineData {
  ourLine: TimelinePoint[];
  opponentLine: TimelinePoint[];
  entries: SetTimelineEntry[];
  totalPoints: number;
  winningScore: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildSetTimeline = (setData: VolleyballSet): SetTimelineData => {
  let ourScore = 0;
  let opponentScore = 0;

  const ourLine: TimelinePoint[] = [{ x: 0, y: 0, eventIndex: null }];
  const opponentLine: TimelinePoint[] = [{ x: 0, y: 0, eventIndex: null }];
  const entries: SetTimelineEntry[] = [];

  setData.events.forEach((event, index) => {
    if (event.scoringTeam === 'us') {
      ourScore++;
    } else {
      opponentScore++;
    }

    const pointNumber = index + 1;

    ourLine.push({
      x: pointNumber,
      y: ourScore,
      eventIndex: index,
    });

    opponentLine.push({
      x: pointNumber,
      y: opponentScore,
      eventIndex: index,
    });

    entries.push({
      event,
      pointNumber,
      ourScore,
      opponentScore,
    });
  });

  return {
    ourLine,
    opponentLine,
    entries,
    totalPoints: setData.events.length,
    winningScore: Math.max(setData.ourScore, setData.opponentScore, ourScore, opponentScore, 1),
  };
};

const getTimelinePointRadius = (
  context: ScriptableContext<'line'>,
  selectedEventIndex: number | null,
  graphMode: GraphMode
) => {
  const point = context.raw as TimelinePoint;

  if (point.eventIndex === null) {
    return 0;
  }

  if (point.eventIndex === selectedEventIndex) {
    return graphMode === 'precision' ? 7 : 6;
  }

  return graphMode === 'precision' ? 4 : 3;
};

const Analysis: FC<Props> = ({ match, onReset, onUpdate }) => {
  const { t, language, setLanguage } = useLanguage();
  const [viewSetIndex, setViewSetIndex] = useState<number | 'all'>('all');
  const [viewSelectorFits, setViewSelectorFits] = useState(false);
  const [setGraphMode, setSetGraphMode] = useState<GraphMode>('full');
  const [precisionStart, setPrecisionStart] = useState(1);
  const [selectedTimelineEventIndex, setSelectedTimelineEventIndex] = useState<number | null>(null);
  const [isTimelineDragging, setIsTimelineDragging] = useState(false);
  const viewSelectorRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startPrecision: number } | null>(null);
  const suppressTimelineClickRef = useRef(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  useLayoutEffect(() => {
    const viewSelector = viewSelectorRef.current;

    if (!viewSelector) {
      return;
    }

    const updateViewSelectorFit = () => {
      setViewSelectorFits(viewSelector.scrollWidth <= viewSelector.clientWidth + 1);
    };

    updateViewSelectorFit();

    const handleResize = () => {
      window.requestAnimationFrame(updateViewSelectorFit);
    };

    window.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateViewSelectorFit);
      resizeObserver.observe(viewSelector);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
    };
  }, [language, match.sets.length]);

  const isMatchOver = useMemo(() => {
    const ourSetsWon = match.sets.filter(setData => setData.finished && setData.ourScore > setData.opponentScore).length;
    const opponentSetsWon = match.sets.filter(setData => setData.finished && setData.opponentScore > setData.ourScore).length;
    const setsToWin = match.type === '3set' ? 2 : 3;
    return ourSetsWon === setsToWin || opponentSetsWon === setsToWin;
  }, [match.sets, match.type]);

  const selectedSet = useMemo(
    () => (viewSetIndex === 'all' ? null : match.sets[viewSetIndex]),
    [match.sets, viewSetIndex]
  );

  const selectedEvents = useMemo(() => {
    if (viewSetIndex === 'all') {
      return match.sets.flatMap(setData => setData.events);
    }
    return match.sets[viewSetIndex].events;
  }, [match.sets, viewSetIndex]);

  const selectedSetTimeline = useMemo(
    () => (selectedSet ? buildSetTimeline(selectedSet) : null),
    [selectedSet]
  );

  const precisionWindow = selectedSetTimeline
    ? Math.min(SET_TIMELINE_WINDOW, Math.max(selectedSetTimeline.totalPoints, 1))
    : 1;

  const maxPrecisionStart = selectedSetTimeline
    ? Math.max(selectedSetTimeline.totalPoints - precisionWindow + 1, 1)
    : 1;

  const precisionEnd = selectedSetTimeline
    ? Math.min(selectedSetTimeline.totalPoints, precisionStart + precisionWindow - 1)
    : 1;

  const selectedTimelineEntry = selectedSetTimeline && selectedTimelineEventIndex !== null
    ? selectedSetTimeline.entries[selectedTimelineEventIndex] ?? null
    : null;

  useEffect(() => {
    setSetGraphMode('full');
    setPrecisionStart(1);
    setSelectedTimelineEventIndex(null);
  }, [viewSetIndex]);

  useEffect(() => {
    if (!selectedSetTimeline) {
      return;
    }

    setPrecisionStart(currentStart => clamp(currentStart, 1, maxPrecisionStart));

    if (selectedTimelineEventIndex !== null && selectedTimelineEventIndex >= selectedSetTimeline.entries.length) {
      setSelectedTimelineEventIndex(null);
    }
  }, [maxPrecisionStart, selectedSetTimeline, selectedTimelineEventIndex]);

  useEffect(() => {
    setIsTimelineDragging(false);
    dragStateRef.current = null;
    suppressTimelineClickRef.current = false;

    if (setGraphMode === 'precision') {
      setSelectedTimelineEventIndex(null);
    }
  }, [viewSetIndex, setGraphMode]);

  const stats = useMemo(() => {
    const s = {
      ourPoints: 0,
      opponentPoints: 0,
      scoring: {} as Record<string, number>,
      errors: {} as Record<string, number>,
      receive: { A: 0, B: 0, C: 0 },
      protection: { yes: 0, no: 0 },
      failedReceiveAgainst: 0,
      goodSpikeAgainst: 0,
      totalReceptionRallies: 0,
      sideoutsScored: 0
    };

    selectedEvents.forEach(event => {
      if (event.details.receiveQuality) {
        s.receive[event.details.receiveQuality]++;
      }

      if (event.servingTeam === 'opponent' && event.reason !== 'serve_miss') {
        s.totalReceptionRallies++;
        if (event.scoringTeam === 'us' && event.details.sideout) {
          s.sideoutsScored++;
        }
      }

      if (event.scoringTeam === 'us') {
        s.ourPoints++;
        s.scoring[event.reason] = (s.scoring[event.reason] || 0) + 1;
      } else {
        s.opponentPoints++;
        s.errors[event.reason] = (s.errors[event.reason] || 0) + 1;
        if (event.reason === 'block_against') {
          if (event.details.protection) {
            s.protection.yes++;
          } else {
            s.protection.no++;
          }
        }
        if (event.reason === 'spike_kill_against') {
          if (event.details.failedReceive) {
            s.failedReceiveAgainst++;
          } else {
            s.goodSpikeAgainst++;
          }
        }
      }
    });

    return s;
  }, [selectedEvents]);

  const getChartOptions = (title: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
            const percentage = total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%';
            return `${label}: ${value} (${percentage})`;
          }
        }
      },
      title: {
        display: false,
        text: title,
        color: '#ffffff'
      },
    },
  });

  const setTimelineData = useMemo<ChartData<'line'>>(() => {
    if (!selectedSetTimeline) {
      return { datasets: [] };
    }

    return {
      datasets: [
        {
          label: match.ourTeamName,
          data: selectedSetTimeline.ourLine,
          parsing: false,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          borderWidth: 3,
          tension: 0,
          pointRadius: context => getTimelinePointRadius(context, selectedTimelineEventIndex, setGraphMode),
          pointHoverRadius: 8,
          pointHitRadius: 14,
        },
        {
          label: match.opponentTeamName,
          data: selectedSetTimeline.opponentLine,
          parsing: false,
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          borderWidth: 3,
          tension: 0,
          pointRadius: context => getTimelinePointRadius(context, selectedTimelineEventIndex, setGraphMode),
          pointHoverRadius: 8,
          pointHitRadius: 14,
        }
      ]
    };
  }, [
    match.opponentTeamName,
    match.ourTeamName,
    selectedSetTimeline,
    selectedTimelineEventIndex,
    setGraphMode
  ]);

  const setTimelineOptions = useMemo<ChartOptions<'line'>>(() => {
    if (!selectedSetTimeline) {
      return {};
    }

    const xAxisMin = setGraphMode === 'precision' ? Math.max(0, precisionStart - 1) : 0;
    const xAxisMax = setGraphMode === 'precision'
      ? Math.min(selectedSetTimeline.totalPoints, precisionEnd)
      : selectedSetTimeline.totalPoints;

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: true,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#ffffff',
            usePointStyle: true,
          }
        },
        tooltip: {
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              const point = items[0]?.raw as TimelinePoint | undefined;

              if (!point || point.eventIndex === null) {
                return t.analysis.setScoreFlow;
              }

              return `${t.analysis.pointLabel} ${point.eventIndex + 1}`;
            },
            label: (context: TooltipItem<'line'>) => `${context.dataset.label}: ${context.parsed.y}`,
            afterBody: (items: TooltipItem<'line'>[]) => {
              const point = items[0]?.raw as TimelinePoint | undefined;

              if (!point || point.eventIndex === null) {
                return [];
              }

              const entry = selectedSetTimeline.entries[point.eventIndex];
              const scoringTeamName = entry.event.scoringTeam === 'us' ? match.ourTeamName : match.opponentTeamName;

              return [
                `${t.analysis.scoredBy}: ${scoringTeamName}`,
                `${t.analysis.reasonLabel}: ${t.reasons[entry.event.reason]}`,
                `${t.analysis.scoreAfterPoint}: ${entry.ourScore} - ${entry.opponentScore}`,
              ];
            }
          }
        }
      },
      onClick: (_event, activeElements, chart) => {
        if (suppressTimelineClickRef.current) {
          suppressTimelineClickRef.current = false;
          return;
        }

        const clickedPoint = activeElements.find(element => element.index > 0);

        if (!clickedPoint) {
          setSelectedTimelineEventIndex(null);
          return;
        }

        setSelectedTimelineEventIndex(clickedPoint.index - 1);
        chart.canvas.style.cursor = 'pointer';
      },
      onHover: (_event, activeElements, chart) => {
        const isClickablePoint = activeElements.some(element => element.index > 0);
        chart.canvas.style.cursor = isClickablePoint ? 'pointer' : 'default';
      },
      scales: {
        x: {
          type: 'linear',
          min: xAxisMin,
          max: xAxisMax,
          ticks: {
            color: '#ffffff',
            stepSize: 1,
            precision: 0,
          },
          title: {
            display: true,
            text: t.analysis.setFlowXAxis,
            color: '#ffffff',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          min: 0,
          max: selectedSetTimeline.winningScore,
          ticks: {
            color: '#ffffff',
            stepSize: 1,
            precision: 0,
          },
          title: {
            display: true,
            text: t.analysis.setFlowYAxis,
            color: '#ffffff',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    };
  }, [
    match.opponentTeamName,
    match.ourTeamName,
    precisionEnd,
    precisionStart,
    selectedSetTimeline,
    setGraphMode,
    t.analysis.pointLabel,
    t.analysis.reasonLabel,
    t.analysis.scoreAfterPoint,
    t.analysis.scoredBy,
    t.analysis.setFlowXAxis,
    t.analysis.setFlowYAxis,
    t.analysis.setScoreFlow,
    t.reasons
  ]);

  const canDragTimeline = setGraphMode === 'precision' && !!selectedSetTimeline && selectedSetTimeline.totalPoints > precisionWindow;

  const handleTimelinePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDragTimeline) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startPrecision: precisionStart,
    };

    suppressTimelineClickRef.current = false;
  };

  const handleTimelinePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDragTimeline || !dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const containerWidth = event.currentTarget.clientWidth;

    if (containerWidth <= 0) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const pointsSpan = Math.max(maxPrecisionStart - 1, 1);
    const movedPoints = Math.round((deltaX / containerWidth) * pointsSpan);
    const nextPrecisionStart = clamp(
      dragStateRef.current.startPrecision - movedPoints,
      1,
      maxPrecisionStart
    );

    if (Math.abs(deltaX) > 6) {
      suppressTimelineClickRef.current = true;
      setIsTimelineDragging(true);
    }

    setPrecisionStart(nextPrecisionStart);
  };

  const handleTimelinePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsTimelineDragging(false);
  };

  const selectedPointTags = useMemo(() => {
    if (!selectedTimelineEntry) {
      return [];
    }

    const { event } = selectedTimelineEntry;
    const tags: string[] = [];

    if (event.details.receiveQuality) {
      tags.push(`${t.analysis.receiveQuality}: ${event.details.receiveQuality}`);
    }

    if (event.details.sideout !== undefined) {
      tags.push(`${t.recording.wasItSideout} ${event.details.sideout ? t.common.yes : t.common.no}`);
    }

    if (event.details.protection !== undefined) {
      tags.push(`${t.recording.wasThereCover} ${event.details.protection ? t.common.yes : t.common.no}`);
    }

    if (event.details.failedReceive !== undefined) {
      tags.push(event.details.failedReceive ? t.recording.failedReceive : t.recording.goodSpike);
    }

    return tags;
  }, [selectedTimelineEntry, t.analysis.receiveQuality, t.common.no, t.common.yes, t.recording]);

  const getPercent = (value: number, total: number) => {
    if (total === 0) {
      return '0%';
    }
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const receiveTotal = stats.receive.A + stats.receive.B + stats.receive.C;
  const unforcedErrors = (stats.errors.missed_free_ball || 0) +
    (stats.errors.ball_into_net || 0) +
    (stats.errors.ball_out_of_bounds || 0) +
    (stats.errors.bad_set || 0) +
    (stats.errors.serve_miss || 0);

  const scoringKeys = SCORING_ORDER.filter(key => (stats.scoring[key] || 0) > 0);
  const scoringData = {
    labels: scoringKeys.map(reason => t.reasons[reason as keyof typeof t.reasons]),
    datasets: [{
      data: scoringKeys.map(key => stats.scoring[key]),
      backgroundColor: scoringKeys.map(reason => ACTION_COLORS[reason] || '#cccccc'),
    }]
  };

  const errorKeys = ERROR_ORDER.filter(key => (stats.errors[key] || 0) > 0);
  const errorData = {
    labels: errorKeys.map(reason => t.reasons[reason as keyof typeof t.reasons]),
    datasets: [{
      data: errorKeys.map(key => stats.errors[key]),
      backgroundColor: errorKeys.map(reason => ACTION_COLORS[reason] || '#cccccc'),
    }]
  };

  const receiveData = {
    labels: [t.recording.passA, t.recording.passB, t.recording.passC],
    datasets: [{
      label: t.analysis.receiveQuality,
      data: [stats.receive.A, stats.receive.B, stats.receive.C],
      backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
    }]
  };

  const pointsPerSetData = {
    labels: match.sets.map((_, index) => `${t.common.set} ${index + 1}`),
    datasets: [
      {
        label: t.analysis.ourScore,
        data: match.sets.map(setData => setData.ourScore),
        backgroundColor: '#3b82f6',
      },
      {
        label: t.analysis.opponentScore,
        data: match.sets.map(setData => setData.opponentScore),
        backgroundColor: '#ef4444',
      }
    ]
  };

  const downloadJson = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(serializeMatch(match))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${match.ourTeamName} vs ${match.opponentTeamName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="analysis-container">
      <div className="stats-grid">
        <header className="analysis-header stat-card full-width">
          {!isMatchOver && (
            <button
              className="back-button icon-button"
              onClick={() => onUpdate({ ...match, status: 'playing' })}
              title={t.analysis.backToMatch}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h1>{t.analysis.title}</h1>
          <button onClick={toggleLanguage} className="lang-btn analysis-lang-btn">
            {language === 'en' ? 'PT' : 'EN'}
          </button>
        </header>

        <div
          className={`view-selector stat-card full-width${viewSelectorFits ? ' view-selector-fit' : ''}`}
          ref={viewSelectorRef}
        >
          <button
            className={viewSetIndex === 'all' ? 'active' : ''}
            onClick={() => setViewSetIndex('all')}
          >
            {t.analysis.allMatch}
          </button>
          {match.sets.map((_, index) => (
            <button
              key={index}
              className={viewSetIndex === index ? 'active' : ''}
              onClick={() => setViewSetIndex(index)}
            >
              {t.common.set} {index + 1}
            </button>
          ))}
          <div className="view-selector-divider"></div>
          <button className="secondary" onClick={downloadJson}>
            <Download size={18} /> {t.analysis.exportJson}
          </button>
          <button className="secondary" onClick={onReset}>
            <RefreshCw size={18} /> {t.analysis.newMatch}
          </button>
        </div>

        <div className="stat-card summary">
          <h3>{t.analysis.summary}</h3>
          <div className="score-display">
            <div className="team">
              <span className="name">{match.ourTeamName}</span>
              <span className="val">{stats.ourPoints}</span>
            </div>
            <div className="div">:</div>
            <div className="team">
              <span className="name">{match.opponentTeamName}</span>
              <span className="val">{stats.opponentPoints}</span>
            </div>
          </div>
          <p>{t.analysis.totalPoints}: {stats.ourPoints + stats.opponentPoints}</p>
        </div>

        <div className="stat-card">
          <h3>{t.analysis.scoringDist}</h3>
          <div className="chart-container">
            <Doughnut data={scoringData} options={getChartOptions('Scoring')} />
          </div>
        </div>

        <div className="stat-card">
          <h3>{t.analysis.errorDist}</h3>
          <div className="chart-container">
            <Doughnut data={errorData} options={getChartOptions('Errors')} />
          </div>
        </div>

        <div className="stat-card">
          <h3>{t.analysis.receiveQualityDist}</h3>
          <div className="chart-container">
            <Pie data={receiveData} options={getChartOptions('Receive')} />
          </div>
        </div>

        {viewSetIndex === 'all' && (
          <div className="stat-card full-width">
            <h3>{t.analysis.pointsPerSet}</h3>
            <div className="chart-container bar">
              <Bar
                data={pointsPerSetData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: '#ffffff'
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: '#ffffff'
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      }
                    },
                    y: {
                      ticks: {
                        color: '#ffffff'
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {viewSetIndex !== 'all' && (
          <div className="stat-card full-width set-timeline-card">
            <div className="set-timeline-header">
              <div>
                <h3>{t.analysis.setScoreFlow}</h3>
                <p className="timeline-hint">{t.analysis.clickPointHint}</p>
              </div>
              <div className="set-timeline-toggle">
                <button
                  className={setGraphMode === 'full' ? 'active' : ''}
                  onClick={() => setSetGraphMode('full')}
                  type="button"
                >
                  {t.analysis.fullView}
                </button>
                <button
                  className={setGraphMode === 'precision' ? 'active' : ''}
                  onClick={() => setSetGraphMode('precision')}
                  type="button"
                >
                  {t.analysis.precisionView}
                </button>
              </div>
            </div>

            {selectedSetTimeline && selectedSetTimeline.totalPoints > 0 ? (
              <>
                {setGraphMode === 'precision' && selectedSetTimeline.totalPoints > precisionWindow && (
                  <div className="timeline-slider-row">
                    <label htmlFor="set-timeline-range">
                      {t.analysis.visiblePoints}: {precisionStart}-{precisionEnd}
                    </label>
                    <input
                      id="set-timeline-range"
                      type="range"
                      min={1}
                      max={maxPrecisionStart}
                      value={precisionStart}
                      onChange={event => setPrecisionStart(Number(event.target.value))}
                    />
                  </div>
                )}

                <div
                  className={`chart-container timeline${canDragTimeline ? ' draggable' : ''}${isTimelineDragging ? ' dragging' : ''}`}
                  onPointerDown={handleTimelinePointerDown}
                  onPointerMove={handleTimelinePointerMove}
                  onPointerUp={handleTimelinePointerEnd}
                  onPointerCancel={handleTimelinePointerEnd}
                  onPointerLeave={handleTimelinePointerEnd}
                >
                  <Line data={setTimelineData} options={setTimelineOptions} />
                </div>

                {selectedTimelineEntry ? (
                  <div className="timeline-details">
                    <h4>
                      {t.analysis.pointDetails}: {t.analysis.pointLabel} {selectedTimelineEntry.pointNumber}
                    </h4>
                    <div className="timeline-details-grid">
                      <div className="timeline-details-item">
                        <span>{t.analysis.scoredBy}</span>
                        <span>
                          {selectedTimelineEntry.event.scoringTeam === 'us' ? match.ourTeamName : match.opponentTeamName}
                        </span>
                      </div>
                      <div className="timeline-details-item">
                        <span>{t.analysis.servingTeam}</span>
                        <span>
                          {selectedTimelineEntry.event.servingTeam === 'us' ? match.ourTeamName : match.opponentTeamName}
                        </span>
                      </div>
                      <div className="timeline-details-item">
                        <span>{t.analysis.reasonLabel}</span>
                        <span>{t.reasons[selectedTimelineEntry.event.reason]}</span>
                      </div>
                      <div className="timeline-details-item">
                        <span>{t.analysis.scoreAfterPoint}</span>
                        <span>{selectedTimelineEntry.ourScore} - {selectedTimelineEntry.opponentScore}</span>
                      </div>
                    </div>

                    {selectedPointTags.length > 0 && (
                      <div className="timeline-tags">
                        {selectedPointTags.map(tag => (
                          <span className="timeline-tag" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="timeline-details timeline-details-empty">
                    <p>{t.analysis.clickPointHint}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="timeline-empty-state">
                <p>{t.analysis.noPointsInSet}</p>
              </div>
            )}
          </div>
        )}

        <div className="stat-card full-width">
          <h3>{t.analysis.detailedStats}</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span>{t.analysis.blocks}:</span>
              <span>{stats.scoring.block || 0} ({getPercent(stats.scoring.block || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.blockOuts}:</span>
              <span>{stats.scoring.block_out || 0} ({getPercent(stats.scoring.block_out || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.spikeKills}:</span>
              <span>{stats.scoring.spike_kill || 0} ({getPercent(stats.scoring.spike_kill || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.spikeTips}:</span>
              <span>{stats.scoring.spike_tip || 0} ({getPercent(stats.scoring.spike_tip || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.aces}:</span>
              <span>{stats.scoring.ace || 0} ({getPercent(stats.scoring.ace || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.setDumps}:</span>
              <span>{stats.scoring.set_dump || 0} ({getPercent(stats.scoring.set_dump || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.opponentErrors}:</span>
              <span>{stats.scoring.opponent_error || 0} ({getPercent(stats.scoring.opponent_error || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.sideouts}:</span>
              <span>{stats.sideoutsScored} / {stats.totalReceptionRallies} ({getPercent(stats.sideoutsScored, stats.totalReceptionRallies)})</span>
            </div>
            <hr />
            <div className="stat-item">
              <span>{t.analysis.receiveQuality}:</span>
              <span>
                A: {getPercent(stats.receive.A, receiveTotal)} |
                {' '}B: {getPercent(stats.receive.B, receiveTotal)} |
                {' '}C: {getPercent(stats.receive.C, receiveTotal)}
              </span>
            </div>
            <hr />
            <div className="stat-item">
              <span>{t.analysis.blockOutAgainst}:</span>
              <span>{stats.errors.block_out_against || 0} ({getPercent(stats.errors.block_out_against || 0, stats.opponentPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.coverExisted}:</span>
              <span>
                {stats.protection.yes} {t.common.yes} ({getPercent(stats.protection.yes, stats.protection.yes + stats.protection.no)}) /{' '}
                {stats.protection.no} {t.common.no} ({getPercent(stats.protection.no, stats.protection.yes + stats.protection.no)})
              </span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.opponentSpikeKills}:</span>
              <span>
                {stats.goodSpikeAgainst} {t.recording.goodSpike} ({getPercent(stats.goodSpikeAgainst, stats.goodSpikeAgainst + stats.failedReceiveAgainst)}) /{' '}
                {stats.failedReceiveAgainst} {t.recording.failedReceive} ({getPercent(stats.failedReceiveAgainst, stats.goodSpikeAgainst + stats.failedReceiveAgainst)})
              </span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.opponentSpikeTips}:</span>
              <span>{stats.errors.spike_tip_against || 0} ({getPercent(stats.errors.spike_tip_against || 0, stats.opponentPoints)})</span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.pointsGiven}:</span>
              <span>{unforcedErrors} ({getPercent(unforcedErrors, stats.opponentPoints)})</span>
            </div>
          </div>
        </div>

        {!isMatchOver && (
          <button className="stat-card primary-large full-width" onClick={() => onUpdate({ ...match, status: 'playing' })}>
            <ChevronLeft size={18} /> {t.analysis.resumeMatch}
          </button>
        )}
      </div>
    </div>
  );
};

export default Analysis;
