import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { HiSearch, HiLightningBolt, HiShieldCheck, HiClock } from 'react-icons/hi';
import SearchBar from '../components/SearchBar';
import ThemeToggle from '../components/ThemeToggle';
import AnimatedCounter from '../components/AnimatedCounter';
import { useRouter } from 'next/router';
import CaptchaModal from '../components/CaptchaModal';
import axios from 'axios';

export default function Home() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [totalSearches, setTotalSearches] = useState<number | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const [isSubmittingCaptcha, setIsSubmittingCaptcha] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>('');

  const fetchSearchCount = () => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.totalSearches) {
          setTotalSearches(parseInt(data.data.totalSearches));
        }
      })
      .catch(() => setTotalSearches(null));
  };

  useEffect(() => {
    // Fetch total searches counter on mount
    fetchSearchCount();
    
    // Refresh counter every 5 seconds for live updates
    const interval = setInterval(fetchSearchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    try {
      // Check if we're rate limited by making a test request
      const response = await axios.get(`/api/profile/${encodeURIComponent(query)}`);
      
      if (response.data.success) {
        router.push(`/profile/${encodeURIComponent(query)}`);
      } else {
        throw new Error(response.data.error || 'Search failed');
      }
    } catch (error: any) {
      if (error.response?.status === 429 && error.response.data?.requiresCaptcha) {
        // Show CAPTCHA modal
        setPendingQuery(query);
        setShowCaptcha(true);
        setIsSearching(false);
        return;
      }
      
      // For other errors, proceed with navigation (will show error on profile page)
      router.push(`/profile/${encodeURIComponent(query)}`);
    }
    
    setIsSearching(false);
  };

  const handleCaptchaSubmit = async (token: string) => {
    setIsSubmittingCaptcha(true);
    setCaptchaError('');

    try {
      // Retry the search with reCAPTCHA token
      const response = await axios.get(
        `/api/profile/${encodeURIComponent(pendingQuery)}?recaptcha_token=${encodeURIComponent(token)}`
      );

      if (response.data.success) {
        setShowCaptcha(false);
        setPendingQuery('');
        router.push(`/profile/${encodeURIComponent(pendingQuery)}`);
      } else {
        setCaptchaError(response.data.error || 'reCAPTCHA verification failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'reCAPTCHA verification failed';
      setCaptchaError(errorMessage);
    } finally {
      setIsSubmittingCaptcha(false);
    }
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
    setCaptchaError('');
    setPendingQuery('');
  };

  const features = [
    { 
      title: 'Multi-Source Intel', 
      desc: 'Steam, Faceit, Leetify data consolidated',
      icon: HiSearch
    },
    { 
      title: 'Risk Assessment', 
      desc: 'AI-powered Trust Variance scoring',
      icon: HiShieldCheck
    },
    { 
      title: 'Real-Time', 
      desc: 'Live data fetching and caching',
      icon: HiClock
    },
  ];

  return (
    <>
      <Head>
        <title>Vantage - CS2 Intelligence Platform</title>
      </Head>
      
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-8 bg-background transition-colors relative overflow-hidden">
        {/* Theme Toggle - Top Right */}
        <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-50">
          <ThemeToggle />
        </div>

        {/* Background Grid Effect - Fixed */}
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
            }}
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center mb-6 sm:mb-8 px-4"
        >
          {/* Logo/Title */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4">
            <HiLightningBolt className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-primary" />
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-primary text-glow">
              VANTAGE
            </h1>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground italic mb-2">
            See what they're hiding.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            CS2 Intelligence Platform
          </p>
          
          {/* Live Counter Box */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex px-3 sm:px-4 py-2 bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <HiSearch className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-bold text-primary font-mono">
                  {totalSearches !== null ? (
                    <AnimatedCounter value={totalSearches} duration={1.2} />
                  ) : (
                    '...'
                  )}
                </span>
                <span className="text-xs text-muted-foreground font-medium">profiles analyzed</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 w-full max-w-xl sm:max-w-2xl"
        >
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          
          {/* Example searches */}
          <div className="mt-4 sm:mt-6 text-center text-sm text-muted-foreground">
            <p className="mb-2">Try searching:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'steamcommunity.com/id/username',
                '76561198...',
                'STEAM_0:1:12345',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => handleSearch(example)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-card border border-border 
                           rounded hover:border-primary hover:bg-accent transition-colors
                           text-foreground"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10 mt-8 sm:mt-12 md:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl w-full px-4"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02, y: -2 }}
              className="p-4 sm:p-6 bg-card border border-border 
                       rounded-lg backdrop-blur-sm hover:border-primary hover:shadow-lg transition-all shadow-sm"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h3 className="text-base sm:text-lg font-bold text-primary">
                  {feature.title}
                </h3>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* CAPTCHA Modal */}
      <CaptchaModal
        isOpen={showCaptcha}
        onSubmit={handleCaptchaSubmit}
        onClose={handleCaptchaClose}
        isLoading={isSubmittingCaptcha}
        error={captchaError}
      />
    </>
  );
}
