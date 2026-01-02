import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Head from 'next/head';
import { HiArrowLeft, HiRefresh } from 'react-icons/hi';
import axios from 'axios';
import { useState } from 'react';

import ProfileCard from '../../components/ProfileCard';
import RiskMeter from '../../components/RiskMeter';
import MatchHistory from '../../components/MatchHistory';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorState from '../../components/ErrorState';
import CaptchaModal from '../../components/CaptchaModal';
import DetailedStats from '../../components/DetailedStats';
import type { UserProfile, ApiResponse } from '@vantage/shared';

export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const res = await axios.get<ApiResponse<UserProfile>>(`/api/profile/${id}`);
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 429) {
          setShowCaptcha(true);
          return { requiresCaptcha: true, success: false };
        }
        throw err;
      }
    },
    enabled: !!id,
    retry: false
  });

  const handleRefresh = async () => {
    if (!id || isRefreshing) return;
    
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const response = await axios.post(`/api/profile/${id}/refresh`);
      if (response.data.success) {
        await refetch();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to refresh profile';
      setRefreshError(errorMsg);
      console.error('Failed to refresh profile:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshMatches = async () => {
    if (!id || isRefreshingMatches) return;
    
    setIsRefreshingMatches(true);
    setRefreshError(null);
    try {
      const response = await axios.post(`/api/profile/${id}/refresh-matches`);
      if (response.data.success) {
        await refetch();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to refresh matches';
      setRefreshError(errorMsg);
      console.error('Failed to refresh matches:', err);
    } finally {
      setIsRefreshingMatches(false);
    }
  };

  if (showCaptcha) return <CaptchaModal isOpen={true} onClose={() => router.push('/')} onSubmit={() => { setShowCaptcha(false); refetch(); }} isLoading={isLoading} />;
  if (isLoading) return <LoadingScreen />;
  if (error || (data && !data.success && !(data as any).requiresCaptcha)) {
    return <ErrorState title="Error" message="Profile not found or API error." onRetry={refetch} />;
  }
  if (!data?.data) return null;

  const profile = data.data;

  return (
    <>
      <Head>
        <title>{profile.steam.username} | Vantage</title>
      </Head>

      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => router.push('/')} 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <HiArrowLeft /> Back to Search
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshMatches}
                disabled={isRefreshingMatches}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground border border-border rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <HiRefresh className={isRefreshingMatches ? 'animate-spin' : ''} />
                {isRefreshingMatches ? 'Refreshing...' : 'Refresh Matches'}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <HiRefresh className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Refreshing...' : 'Refresh All'}
              </button>
            </div>
          </div>

          {refreshError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-sm">
              {refreshError}
            </div>
          )}

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <ProfileCard profile={profile} />
              <DetailedStats profile={profile} />
              <MatchHistory 
                faceitMatches={profile.faceit?.matchHistory} 
                leetifyStats={profile.leetify}
                onRefresh={handleRefreshMatches}
              />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-6">
                <RiskMeter risk={profile.risk} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}