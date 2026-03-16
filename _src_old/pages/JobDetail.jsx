import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  BookOpen,
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Rocket,
  Menu,
  X,
  FileText,
  CheckCircle,
  Building2,
  AlertCircle
} from "lucide-react";
import { getCiscoUnit, loadAggregates, loadWorkTypes, loadEducationTypes, loadExperienceTypes, searchTitles, getJobPostingsByCiscoCode, generateWORCSearchURL } from "@/lib/data";
import JobPostings from "@/components/JobPostings";

export default function JobDetail({ ciscoCode, onNavigate }) {
  const [unit, setUnit] = useState(null);
  const [stats, setStats] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCareerPlan, setShowCareerPlan] = useState(false);

  const workTypes = useMemo(() => loadWorkTypes(), []);
  const eduTypes = useMemo(() => loadEducationTypes(), []);
  const expTypes = useMemo(() => loadExperienceTypes(), []);
  const aggregates = useMemo(() => loadAggregates(), []);

  // Generate employer data for career plan
  const employerData = useMemo(() => {
    if (!ciscoCode) return [];
    
    const postings = getJobPostingsByCiscoCode(ciscoCode);
    const employerMap = new Map();
    
    postings.forEach(posting => {
      const employer = posting.Employer;
      if (!employer) return;
      
      if (!employerMap.has(employer)) {
        employerMap.set(employer, {
          name: employer,
          totalPostings: 0,
          activePostings: 0,
          recentPosting: null,
          isActiveHiring: false
        });
      }
      
      const empData = employerMap.get(employer);
      empData.totalPostings++;
      
      if (posting.isActive) {
        empData.activePostings++;
        empData.isActiveHiring = true;
      }
      
      // Track most recent posting
      if (!empData.recentPosting || posting.createdDate > empData.recentPosting.createdDate) {
        empData.recentPosting = posting;
      }
    });
    
    // Convert to array and sort by active hiring first, then by total postings
    return Array.from(employerMap.values()).sort((a, b) => {
      if (a.isActiveHiring !== b.isActiveHiring) {
        return a.isActiveHiring ? -1 : 1;
      }
      return b.totalPostings - a.totalPostings;
    });
  }, [ciscoCode]);

  useEffect(() => {
    if (ciscoCode) {
      setLoading(true);
      const unitData = getCiscoUnit(ciscoCode);
      const unitStats = aggregates.get(ciscoCode);
      
      setUnit(unitData);
      setStats(unitStats);

      // Get related jobs by searching for similar titles
      if (unitData?.title) {
        const related = searchTitles(unitData.title, 10);
        setRelatedJobs(related.slice(0, 6)); // Show top 6 related
      }
      
      setLoading(false);
    }
  }, [ciscoCode, aggregates]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-300/30 border-t-cyan-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading career details...</p>
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Job Not Found</h1>
          <Button onClick={() => onNavigate('home')}>Go Back</Button>
        </div>
      </div>
    );
  }

  const Bar = ({ label, value, total, color = "bg-cyan-400" }) => (
    <div className="flex items-center gap-2">
      <div className="w-32 text-xs text-neutral-300 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.round((value / Math.max(1, total)) * 100)}%` }} />
      </div>
      <div className="w-16 text-xs text-neutral-400 text-right">{Math.round((value / Math.max(1, total)) * 100)}%</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      {/* Dynamic background */}
      <div id="bg-gradient" aria-hidden className="fixed inset-0 -z-10 bg-[length:200%_200%]" style={{ 
        backgroundImage: "radial-gradient(1200px 1200px at 10% 10%, rgba(56,189,248,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 90% 20%, rgba(34,197,94,0.18) 0%, transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(147,51,234,0.12) 0%, transparent 60%)", 
        backgroundPosition: "0% 50%" 
      }} />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <div className="h-8 w-8 rounded-xl bg-cyan-400/20 grid place-items-center ring-1 ring-cyan-300/30">
              <Rocket className="w-4 h-4 text-cyan-300" />
            </div>
            <span className="font-semibold tracking-tight">careers<span className="text-cyan-300">.ky</span></span>
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-300">
            <button onClick={() => onNavigate('home')} className="hover:text-white transition">Home</button>
            <button onClick={() => onNavigate('career-tracks')} className="hover:text-white transition">Career Tracks</button>
            <button onClick={() => onNavigate('live-search')} className="hover:text-white transition">Live Search</button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-neutral-950/95 backdrop-blur">
            <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('home');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Home
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('career-tracks');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Career Tracks
              </button>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('live-search');
                }}
                className="px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition text-neutral-300 hover:text-white text-left"
              >
                Live Search
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="secondary" 
            onClick={() => onNavigate('career-tracks')}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Career Tracks
          </Button>
        </div>

        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <Badge className="mb-3 bg-cyan-500/20 text-cyan-300 border-cyan-300/30">
                CISCO Unit {unit.id}
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight">
                {unit.title} <span className="text-cyan-300">Jobs in Cayman</span>
              </h1>
              {/* <p className="text-neutral-300 text-lg max-w-3xl mb-6">
                {unit.description}
              </p> */}
            </div>
          </div>

          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Briefcase className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="text-2xl font-semibold">{stats.count}</div>
                  <div className="text-sm text-neutral-400">Job Posts</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div className="text-2xl font-semibold">CI$ {Math.round(stats.mean).toLocaleString()}</div>
                  <div className="text-sm text-neutral-400">Average Salary</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="text-2xl font-semibold">CI$ {Math.round(stats.max).toLocaleString()}</div>
                  <div className="text-sm text-neutral-400">Max Salary</div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <MapPin className="w-5 h-5 text-orange-300" />
                  </div>
                  <div className="text-2xl font-semibold">Cayman</div>
                  <div className="text-sm text-neutral-400">Location</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Job Description</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-300 leading-relaxed">
                    {unit.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Key Tasks */}
            {unit.tasks && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Key Tasks & Responsibilities</h2>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-neutral-300 whitespace-pre-line leading-relaxed">
                      {unit.tasks}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Analysis */}
            {stats && stats.dist && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Market Analysis</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Work Type Distribution
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(stats.dist.work).map(([k, v]) => (
                          <Bar key={k} label={workTypes.get(k) || k} value={v} total={stats.count} color="bg-emerald-400" />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Education Requirements
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(stats.dist.edu).map(([k, v]) => (
                          <Bar key={k} label={eduTypes.get(k) || k} value={v} total={stats.count} color="bg-purple-400" />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Experience Levels
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(stats.dist.exp).map(([k, v]) => (
                          <Bar key={k} label={expTypes.get(k) || k} value={v} total={stats.count} color="bg-orange-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary Range */}
            {stats && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Salary Range
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Minimum</span>
                      <span className="font-medium">CI$ {Math.round(stats.min).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Average</span>
                      <span className="font-medium">CI$ {Math.round(stats.mean).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Maximum</span>
                      <span className="font-medium">CI$ {Math.round(stats.max).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Related Positions</h3>
                  <div className="space-y-3">
                    {relatedJobs.map((job, i) => (
                      <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-cyan-300/40 transition cursor-pointer">
                        <div className="font-medium text-sm">{job.cTitle}</div>
                        <div className="text-xs text-neutral-400">Occupation #{job.sOccupation}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Take Action</h3>
                <div className="space-y-3">

                  <Button 
                    // variant="secondary" 
                    className="w-full gap-2"
                    onClick={() => setShowCareerPlan(true)}
                  >
                    <FileText className="w-4 h-4" />
                    Build Career Plan
                  </Button>
                  <Button 

className="w-full gap-2"
variant="secondary"
onClick={() => onNavigate('live-search', { searchQuery: unit.title })}
>
<ExternalLink className="w-4 h-4" />
Search Live Jobs
</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Job Postings History */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <JobPostings ciscoCode={ciscoCode} unitTitle={unit.title} />
        </div>

        {/* SEO Content */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mb-4">About {unit.title} Careers in Cayman</h2>
            <p className="text-neutral-300 leading-relaxed mb-4">
              {unit.title} positions in the Cayman Islands offer unique opportunities in a thriving offshore financial center. 
              With a growing economy and international business environment, Cayman provides excellent career prospects for professionals in this field.
            </p>
            <p className="text-neutral-300 leading-relaxed mb-4">
              The Cayman Islands job market for {unit.title} roles is characterized by competitive salaries, tax-free income, 
              and opportunities to work with leading international companies. Whether you're looking to advance your career 
              or relocate to a tropical paradise, Cayman offers the perfect combination of professional growth and lifestyle benefits.
            </p>
            <h3 className="text-xl font-semibold mb-3">Why Choose Cayman for {unit.title} Careers?</h3>
            <ul className="list-disc list-inside text-neutral-300 space-y-2">
              <li>Tax-free salary structure</li>
              <li>International business environment</li>
              <li>Growing job market with {stats?.count || 'many'} current opportunities</li>
              <li>High standard of living</li>
              <li>Beautiful tropical location</li>
              <li>Strong regulatory framework</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Career Plan Modal */}
      {showCareerPlan && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-neutral-900/95 backdrop-blur border-b border-white/10 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-semibold mb-2 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-cyan-300" />
                    Career Plan: {unit.title}
                  </h2>
                  <p className="text-neutral-400">Your roadmap to entering this career track in Cayman</p>
                </div>
                <button
                  onClick={() => setShowCareerPlan(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-semibold text-cyan-300">{employerData.length}</div>
                    <div className="text-sm text-neutral-400">Employers</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-semibold text-emerald-300">
                      {employerData.filter(e => e.isActiveHiring).length}
                    </div>
                    <div className="text-sm text-neutral-400">Active Hirers</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-semibold text-purple-300">
                      {stats ? stats.count : 0}
                    </div>
                    <div className="text-sm text-neutral-400">Total Postings</div>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-semibold text-orange-300">
                      CI$ {stats ? Math.round(stats.mean).toLocaleString() : 0}
                    </div>
                    <div className="text-sm text-neutral-400">Avg Salary</div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Tasks & Responsibilities */}
              {unit.tasks && (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-cyan-300" />
                      Key Tasks & Responsibilities
                    </h3>
                    <div className="prose prose-invert max-w-none">
                      <div className="text-neutral-300 whitespace-pre-line leading-relaxed">
                        {unit.tasks}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Experience Required */}
                {stats && stats.dist && stats.dist.exp && (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-300" />
                        Experience Required
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.dist.exp)
                          .sort((a, b) => b[1] - a[1])
                          .map(([key, value]) => {
                            const percentage = Math.round((value / stats.count) * 100);
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-neutral-300">{expTypes.get(key) || key}</span>
                                  <span className="text-neutral-400">{percentage}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div 
                                    className="h-full bg-orange-400" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Education Required */}
                {stats && stats.dist && stats.dist.edu && (
                  <Card className="bg-white/5 border-white/10">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-300" />
                        Education Required
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(stats.dist.edu)
                          .sort((a, b) => b[1] - a[1])
                          .map(([key, value]) => {
                            const percentage = Math.round((value / stats.count) * 100);
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-neutral-300">{eduTypes.get(key) || key}</span>
                                  <span className="text-neutral-400">{percentage}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div 
                                    className="h-full bg-purple-400" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Employers in Cayman */}
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-300" />
                    Employers in Cayman Islands
                  </h3>
                  <p className="text-neutral-400 mb-4">
                    {employerData.length} employers have hired for this position. 
                    {employerData.filter(e => e.isActiveHiring).length > 0 && (
                      <span className="text-emerald-300 font-medium">
                        {' '}{employerData.filter(e => e.isActiveHiring).length} are actively hiring now.
                      </span>
                    )}
                  </p>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {employerData.map((employer, idx) => {
                      // Create a mock job posting object for WORC search URL generation
                      const mockPosting = {
                        cTitle: unit.title,
                        Employer: employer.name
                      };
                      
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border transition ${
                            employer.isActiveHiring
                              ? 'bg-emerald-500/10 border-emerald-300/30 hover:bg-emerald-500/15 cursor-pointer'
                              : 'bg-white/5 border-white/10'
                          }`}
                          onClick={employer.isActiveHiring ? () => {
                            // Close the career plan modal first
                            setShowCareerPlan(false);
                            // Navigate to live search with employer-only search
                            onNavigate('live-search', {
                              searchQuery: '',
                              employer: employer.name,
                              showActiveOnly: false
                            });
                          } : undefined}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg truncate">{employer.name}</h4>
                                {employer.isActiveHiring && (
                                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-300/30 shrink-0 hover:bg-emerald-500/30 transition">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Actively Hiring
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                                <span>{employer.totalPostings} posting{employer.totalPostings !== 1 ? 's' : ''}</span>
                                {employer.activePostings > 0 && (
                                  <span className="text-emerald-300">
                                    {employer.activePostings} active
                                  </span>
                                )}
                                {employer.recentPosting && (
                                  <span>
                                    Last posted: {new Date(employer.recentPosting.createdDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                )}
                              </div>
                              {employer.isActiveHiring && (
                                <div className="mt-2 text-xs text-emerald-300/80">
                                  Click to view active job postings in our live search
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {employerData.length === 0 && (
                    <div className="text-center py-8 text-neutral-400">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No employer data available for this position.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Footer */}
              <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-300/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg mb-1">Ready to take the next step?</h4>
                      <p className="text-neutral-400 text-sm">
                        Search for live job opportunities in this career track
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setShowCareerPlan(false);
                        onNavigate('live-search', { searchQuery: unit.title });
                      }}
                      className="gap-2 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Find Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
