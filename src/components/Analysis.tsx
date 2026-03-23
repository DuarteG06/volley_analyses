import { useState, useMemo, type FC } from 'react';
import type { MatchData } from '../types';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Download, RefreshCw, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../languages/LanguageContext';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const ACTION_COLORS: Record<string, string> = {
  // Scoring actions
  ace: '#4ade80',
  spike_kill: '#60a5fa',
  block: '#a78bfa',
  block_out: '#2dd4bf',
  set_dump: '#facc15',
  opponent_error: '#818cf8',
  
  // Error actions
  serve_miss: '#ef4444',
  spike_kill_against: '#f87171',
  block_against: '#fb923c',
  block_out_against: '#f472b6',
  missed_free_ball: '#fbbf24',
  ball_into_net: '#fb7185',
  ball_out_of_bounds: '#c084fc',
  bad_set: '#38bdf8',
};

const SCORING_ORDER = ['ace', 'spike_kill', 'block', 'block_out', 'set_dump', 'opponent_error'];
const ERROR_ORDER = [
  'serve_miss', 
  'spike_kill_against', 
  'block_against', 
  'block_out_against', 
  'missed_free_ball', 
  'ball_into_net', 
  'ball_out_of_bounds', 
  'bad_set'
];

interface Props {
  match: MatchData;
  onReset: () => void;
  onUpdate: (updated: MatchData) => void;
}

const Analysis: FC<Props> = ({ match, onReset, onUpdate }) => {
  const { t, language, setLanguage } = useLanguage();
  const [viewSetIndex, setViewSetIndex] = useState<number | 'all'>('all');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  const isMatchOver = useMemo(() => {
    const ourSetsWon = match.sets.filter(s => s.finished && s.ourScore > s.opponentScore).length;
    const opponentSetsWon = match.sets.filter(s => s.finished && s.opponentScore > s.ourScore).length;
    const setsToWin = match.type === '3set' ? 2 : 3;
    return ourSetsWon === setsToWin || opponentSetsWon === setsToWin;
  }, [match.sets, match.type]);

  const selectedEvents = useMemo(() => {
    if (viewSetIndex === 'all') {
      return match.sets.flatMap(s => s.events);
    }
    return match.sets[viewSetIndex].events;
  }, [match.sets, viewSetIndex]);

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

      // Sideout tracking: Any rally where opponent served, excluding their serve misses
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
          if (event.details.protection) s.protection.yes++;
          else s.protection.no++;
        }
        if (event.reason === 'spike_kill_against') {
          if (event.details.failedReceive) s.failedReceiveAgainst++;
          else s.goodSpikeAgainst++;
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
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
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

  const getPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const receiveTotal = stats.receive.A + stats.receive.B + stats.receive.C;
  const unforcedErrors = (stats.errors.missed_free_ball || 0) +
    (stats.errors.ball_into_net || 0) +
    (stats.errors.ball_out_of_bounds || 0) +
    (stats.errors.bad_set || 0) +
    (stats.errors.serve_miss || 0);

  const scoringKeys = SCORING_ORDER.filter(k => (stats.scoring[k] || 0) > 0);
  const scoringData = {
    labels: scoringKeys.map(r => t.reasons[r as keyof typeof t.reasons]),
    datasets: [{
      data: scoringKeys.map(k => stats.scoring[k]),
      backgroundColor: scoringKeys.map(r => ACTION_COLORS[r] || '#cccccc'),
    }]
  };

  const errorKeys = ERROR_ORDER.filter(k => (stats.errors[k] || 0) > 0);
  const errorData = {
    labels: errorKeys.map(r => t.reasons[r as keyof typeof t.reasons]),
    datasets: [{
      data: errorKeys.map(k => stats.errors[k]),
      backgroundColor: errorKeys.map(r => ACTION_COLORS[r] || '#cccccc'),
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
    labels: match.sets.map((_, i) => `${t.common.set} ${i + 1}`),
    datasets: [
      {
        label: t.analysis.ourScore,
        data: match.sets.map(s => s.ourScore),
        backgroundColor: '#3b82f6',
      },
      {
        label: t.analysis.opponentScore,
        data: match.sets.map(s => s.opponentScore),
        backgroundColor: '#ef4444',
      }
    ]
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(match));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${match.ourTeamName} vs ${match.opponentTeamName}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="analysis-container">
      <div className="stats-grid">
        <header className="analysis-header stat-card full-width">
          {!isMatchOver && (
            <button className="back-button icon-button" onClick={() => onUpdate({ ...match, status: 'playing' })} title={t.analysis.backToMatch}>
              <ChevronLeft size={24} />
            </button>
          )}
          <h1>{t.analysis.title}</h1>
          <button onClick={toggleLanguage} className="lang-btn analysis-lang-btn">
            {language === 'en' ? 'PT' : 'EN'}
          </button>
        </header>

        <div className="view-selector stat-card full-width">
          <button 
            className={viewSetIndex === 'all' ? 'active' : ''} 
            onClick={() => setViewSetIndex('all')}
          >
            {t.analysis.allMatch}
          </button>
          {match.sets.map((_, i) => (
            <button 
              key={i} 
              className={viewSetIndex === i ? 'active' : ''} 
              onClick={() => setViewSetIndex(i)}
            >
              {t.common.set} {i + 1}
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
                B: {getPercent(stats.receive.B, receiveTotal)} | 
                C: {getPercent(stats.receive.C, receiveTotal)}
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
                {stats.protection.yes} {t.common.yes} ({getPercent(stats.protection.yes, stats.protection.yes + stats.protection.no)}) /{" "}
                {stats.protection.no} {t.common.no} ({getPercent(stats.protection.no, stats.protection.yes + stats.protection.no)})
              </span>
            </div>
            <div className="stat-item">
              <span>{t.analysis.opponentSpikeKills}:</span>
              <span>
                {stats.goodSpikeAgainst} {t.recording.goodSpike} ({getPercent(stats.goodSpikeAgainst, stats.goodSpikeAgainst + stats.failedReceiveAgainst)}) /{" "}
                {stats.failedReceiveAgainst} {t.recording.failedReceive} ({getPercent(stats.failedReceiveAgainst, stats.goodSpikeAgainst + stats.failedReceiveAgainst)})
              </span>
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
