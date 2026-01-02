"use client";

import { useMemo, useState } from 'react';
import { HiViewList, HiRefresh } from 'react-icons/hi';
import { LeetifyMatchCard, LeetifyRecentMatchCard, FaceitMatchCard } from './MatchCards';
import MatchModal from './MatchModal';
import type { MatchStats, LeetifyStats } from '@vantage/shared';

interface MatchHistoryProps {
  faceitMatches?: MatchStats[];
  leetifyStats?: LeetifyStats;
  onRefresh?: () => void;
}

type Source = 'all' | 'faceit' | 'leetify';
const PER_PAGE = 10;

export default function MatchHistory({ faceitMatches, leetifyStats, onRefresh }: MatchHistoryProps) {
  const [source, setSource] = useState<Source>('all');
  const [page, setPage] = useState(1);
  const [modalData, setModalData] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFullMatchDetails = async (match: any, type: 'leetify' | 'faceit') => {
    if (type === 'faceit') {
      setModalData({ match, type, loading: false });
      return;
    }

    if (match.stats && match.stats.length > 1) {
      setModalData({ match, type, loading: false });
      return;
    }

    setModalData({ match: null, type, loading: true });
    
    try {
      const dataSource = match.data_source || 'matchmaking';
      const dataSourceId = match.data_source_match_id;
      
      if (!dataSourceId) {
        setModalData({ match, type, loading: false });
        return;
      }

      const response = await fetch(`/api/matches/${dataSource}/${dataSourceId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setModalData({ match: result.data, type, loading: false });
        } else {
          setModalData({ match, type, loading: false });
        }
      } else {
        setModalData({ match, type, loading: false });
      }
    } catch (error) {
      setModalData({ match, type, loading: false });
    }
  };

  const allMatches = useMemo(() => {
    const list = [];
    if (leetifyStats?.match_history) {
      list.push(...leetifyStats.match_history.map(m => ({ 
        type: 'leetify', data: m, date: new Date(m.finished_at).getTime(), id: m.id 
      })));
    } else if (leetifyStats?.recent_matches) {
      list.push(...leetifyStats.recent_matches.map(m => ({ 
        type: 'leetify-recent', data: m, date: new Date(m.finished_at).getTime(), id: m.id 
      })));
    }
    
    if (faceitMatches) {
      list.push(...faceitMatches.map(m => ({ 
        type: 'faceit', data: m, date: new Date(m.date).getTime(), id: m.matchId 
      })));
    }

    return list
      .filter(m => source === 'all' || m.type.startsWith(source))
      .sort((a, b) => b.date - a.date);
  }, [source, faceitMatches, leetifyStats]);

  const totalPages = Math.ceil(allMatches.length / PER_PAGE);
  const visibleMatches = allMatches.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (allMatches.length === 0) return null;

  return (
    <>
      <MatchModal 
        isOpen={!!modalData} 
        onClose={() => setModalData(null)} 
        match={modalData?.match} 
        type={modalData?.type} 
        loading={modalData?.loading}
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <HiViewList className="text-zinc-500" /> Match History
            </h2>
            {onRefresh && (
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await onRefresh();
                  setIsRefreshing(false);
                }}
                disabled={isRefreshing}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh matches"
              >
                <HiRefresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            {['all', 'faceit', 'leetify'].map((s) => (
              <button
                key={s}
                onClick={() => { setSource(s as Source); setPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                  source === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {visibleMatches.map((item) => {
            if (item.type === 'leetify') {
              return (
                <LeetifyMatchCard 
                  key={item.id} 
                  match={item.data} 
                  steamId={leetifyStats!.steam64_id}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onViewScoreboard={() => fetchFullMatchDetails(item.data, 'leetify')}
                />
              );
            }
            if (item.type === 'leetify-recent') {
              return <LeetifyRecentMatchCard key={item.id} match={item.data} />;
            }
            return (
              <FaceitMatchCard 
                key={item.id} 
                match={item.data} 
                onViewScoreboard={() => fetchFullMatchDetails(item.data, 'faceit')} 
              />
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-sm border border-border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm border border-border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}