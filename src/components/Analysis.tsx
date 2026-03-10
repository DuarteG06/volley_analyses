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

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface Props {
  match: MatchData;
  onReset: () => void;
  onUpdate: (updated: MatchData) => void;
}

const Analysis: FC<Props> = ({ match, onReset, onUpdate }) => {
  const [viewSetIndex, setViewSetIndex] = useState<number | 'all'>('all');

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
      goodSpikeAgainst: 0
    };

    selectedEvents.forEach(event => {
      if (event.scoringTeam === 'us') {
        s.ourPoints++;
        s.scoring[event.reason] = (s.scoring[event.reason] || 0) + 1;
        if (event.details.receiveQuality) {
          s.receive[event.details.receiveQuality]++;
        }
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
      },
    },
  });

  const getPercent = (value: number, total: number) => {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const receiveTotal = stats.receive.A + stats.receive.B + stats.receive.C;

  const scoringData = {
    labels: Object.keys(stats.scoring).map(r => r.replace(/_/g, ' ')),
    datasets: [{
      data: Object.values(stats.scoring),
      backgroundColor: ['#4ade80', '#60a5fa', '#facc15', '#f87171', '#a78bfa'],
    }]
  };

  const errorData = {
    labels: Object.keys(stats.errors).map(r => r.replace(/_/g, ' ')),
    datasets: [{
      data: Object.values(stats.errors),
      backgroundColor: ['#f87171', '#fb923c', '#fbbf24', '#f472b6', '#a78bfa', '#94a3b8'],
    }]
  };

  const receiveData = {
    labels: ['A Pass', 'B Pass', 'C Pass'],
    datasets: [{
      label: 'Receive Quality',
      data: [stats.receive.A, stats.receive.B, stats.receive.C],
      backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
    }]
  };

  const pointsPerSetData = {
    labels: match.sets.map((_, i) => `Set ${i + 1}`),
    datasets: [
      {
        label: 'Our Score',
        data: match.sets.map(s => s.ourScore),
        backgroundColor: '#3b82f6',
      },
      {
        label: 'Opponent Score',
        data: match.sets.map(s => s.opponentScore),
        backgroundColor: '#ef4444',
      }
    ]
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(match));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `match_${match.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="analysis-container">
      <div className="stats-grid">
        <header className="analysis-header stat-card full-width">
          {!isMatchOver && (
            <button className="back-button icon-button" onClick={() => onUpdate({ ...match, status: 'playing' })} title="Back to Match">
              <ChevronLeft size={24} />
            </button>
          )}
          <h1>Match Analysis</h1>
        </header>

        <div className="view-selector stat-card full-width">
          <button 
            className={viewSetIndex === 'all' ? 'active' : ''} 
            onClick={() => setViewSetIndex('all')}
          >
            All Match
          </button>
          {match.sets.map((_, i) => (
            <button 
              key={i} 
              className={viewSetIndex === i ? 'active' : ''} 
              onClick={() => setViewSetIndex(i)}
            >
              Set {i + 1}
            </button>
          ))}
          <div className="view-selector-divider"></div>
          <button className="secondary" onClick={downloadJson}>
            <Download size={18} /> Export JSON
          </button>
          <button className="secondary" onClick={onReset}>
            <RefreshCw size={18} /> New Match
          </button>
        </div>

        <div className="stat-card summary">
          <h3>Summary</h3>
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
          <p>Total points recorded: {stats.ourPoints + stats.opponentPoints}</p>
        </div>

        <div className="stat-card">
          <h3>Scoring Distribution</h3>
          <div className="chart-container">
            <Doughnut data={scoringData} options={getChartOptions('Scoring')} />
          </div>
        </div>

        <div className="stat-card">
          <h3>Error Distribution</h3>
          <div className="chart-container">
            <Doughnut data={errorData} options={getChartOptions('Errors')} />
          </div>
        </div>

        <div className="stat-card">
          <h3>Receive Quality (A/B/C)</h3>
          <div className="chart-container">
            <Pie data={receiveData} options={getChartOptions('Receive')} />
          </div>
        </div>

        {viewSetIndex === 'all' && (
          <div className="stat-card full-width">
            <h3>Points Per Set</h3>
            <div className="chart-container bar">
              <Bar data={pointsPerSetData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        )}

        <div className="stat-card full-width">
          <h3>Detailed Stats</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span>Blocks:</span>
              <span>{stats.scoring.block || 0} ({getPercent(stats.scoring.block || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>Spike Kills:</span>
              <span>{stats.scoring.spike_kill || 0} ({getPercent(stats.scoring.spike_kill || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>Aces:</span>
              <span>{stats.scoring.ace || 0} ({getPercent(stats.scoring.ace || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>Set Dumps:</span>
              <span>{stats.scoring.set_dump || 0} ({getPercent(stats.scoring.set_dump || 0, stats.ourPoints)})</span>
            </div>
            <div className="stat-item">
              <span>Opponent Errors:</span>
              <span>{stats.scoring.opponent_error || 0} ({getPercent(stats.scoring.opponent_error || 0, stats.ourPoints)})</span>
            </div>
            <hr />
            <div className="stat-item">
              <span>Receive Quality:</span>
              <span>
                A: {getPercent(stats.receive.A, receiveTotal)} | 
                B: {getPercent(stats.receive.B, receiveTotal)} | 
                C: {getPercent(stats.receive.C, receiveTotal)}
              </span>
            </div>
            <hr />
            <div className="stat-item">
              <span>Cover existed on blocks against us:</span>
              <span>
                {stats.protection.yes} Yes ({getPercent(stats.protection.yes, stats.protection.yes + stats.protection.no)}) /{" "}
                {stats.protection.no} No ({getPercent(stats.protection.no, stats.protection.yes + stats.protection.no)})
              </span>
            </div>
            <div className="stat-item">
              <span>Opponent spike kills:</span>
              <span>
                {stats.goodSpikeAgainst} Good Spike ({getPercent(stats.goodSpikeAgainst, stats.goodSpikeAgainst + stats.failedReceiveAgainst)}) /{" "}
                {stats.failedReceiveAgainst} Failed Receive ({getPercent(stats.failedReceiveAgainst, stats.goodSpikeAgainst + stats.failedReceiveAgainst)})
              </span>
            </div>
          </div>
        </div>

        {!isMatchOver && (
          <button className="stat-card primary-large full-width" onClick={() => onUpdate({ ...match, status: 'playing' })}>
            <ChevronLeft size={18} /> Resume Match
          </button>
        )}
      </div>
    </div>
  );
};

export default Analysis;
