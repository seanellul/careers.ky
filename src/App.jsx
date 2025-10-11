import React, { useState } from 'react';
import CareersKYLanding from './careers';
import CareerTracks from './pages/CareerTracks';
import JobDetail from './pages/JobDetail';
import LiveSearch from './pages/LiveSearch';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchParams, setSearchParams] = useState({});
  const [careerTracksParams, setCareerTracksParams] = useState({});

  const navigateToPage = (page, params = {}) => {
    setCurrentPage(page);
    
    // Handle job detail navigation
    if (params.ciscoCode && page === 'job-detail') {
      setSelectedJob(params.ciscoCode);
    }
    
    // Handle Live Search params
    if (page === 'live-search') {
      if (params.searchQuery || params.employer || params.showActiveOnly !== undefined || params.ciscoCode) {
        setSearchParams(params);
      } else {
        setSearchParams({});
      }
    }
    
    // Handle Career Tracks params
    if (page === 'career-tracks') {
      if (params.searchQuery || params.ciscoCode) {
        setCareerTracksParams(params);
      } else {
        setCareerTracksParams({});
      }
    }
    
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'career-tracks':
        return <CareerTracks onNavigate={navigateToPage} initialFilters={careerTracksParams} />;
      case 'job-detail':
        return <JobDetail ciscoCode={selectedJob} onNavigate={navigateToPage} />;
      case 'live-search':
        return <LiveSearch onNavigate={navigateToPage} searchParams={searchParams} />;
      case 'home':
      default:
        return <CareersKYLanding onNavigate={navigateToPage} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
    </div>
  );
}

export default App;
