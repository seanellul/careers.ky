import React, { useState } from 'react';
import CareersKYLanding from './careers';
import CareerTracks from './pages/CareerTracks';
import JobDetail from './pages/JobDetail';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedJob, setSelectedJob] = useState(null);

  const navigateToPage = (page, jobCode = null) => {
    setCurrentPage(page);
    if (jobCode) {
      setSelectedJob(jobCode);
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'career-tracks':
        return <CareerTracks onNavigate={navigateToPage} />;
      case 'job-detail':
        return <JobDetail ciscoCode={selectedJob} onNavigate={navigateToPage} />;
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
