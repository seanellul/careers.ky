import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  DollarSign, 
  Users, 
  BookOpen,
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { getCiscoUnit, loadAggregates, loadWorkTypes, loadEducationTypes, loadExperienceTypes, searchTitles } from "@/lib/data";

export default function JobDetail({ ciscoCode, onNavigate }) {
  const [unit, setUnit] = useState(null);
  const [stats, setStats] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);

  const workTypes = useMemo(() => loadWorkTypes(), []);
  const eduTypes = useMemo(() => loadEducationTypes(), []);
  const expTypes = useMemo(() => loadExperienceTypes(), []);
  const aggregates = useMemo(() => loadAggregates(), []);

  useEffect(() => {
    if (ciscoCode) {
      const unitData = getCiscoUnit(ciscoCode);
      const unitStats = aggregates.get(ciscoCode);
      
      setUnit(unitData);
      setStats(unitStats);

      // Get related jobs by searching for similar titles
      if (unitData?.title) {
        const related = searchTitles(unitData.title, 10);
        setRelatedJobs(related.slice(0, 6)); // Show top 6 related
      }
    }
  }, [ciscoCode, aggregates]);

  if (!unit) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Job Not Found</h1>
          <Button onClick={() => window.history.back()}>Go Back</Button>
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
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <span className="font-semibold tracking-tight">Career Details</span>
          </div>
          <div className="flex items-center gap-3">
                  <Button variant="secondary" onClick={() => onNavigate?.('career-tracks')}>
                    Browse All Careers
                  </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <Badge className="mb-3 bg-cyan-500/20 text-cyan-300 border-cyan-300/30">
                CISCO Unit {unit.id}
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight mb-4">
                {unit.title} <span className="text-cyan-300">Jobs in Cayman</span>
              </h1>
              <p className="text-neutral-300 text-lg max-w-3xl mb-6">
                {unit.description}
              </p>
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
                  <Button className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Search Live Jobs
                  </Button>
                  <Button variant="secondary" className="w-full gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Build Career Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
    </div>
  );
}
