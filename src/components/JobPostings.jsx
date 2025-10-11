import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import { 
  getJobPostingsByCiscoCode, 
  generateWORCSearchURL, 
  loadWorkTypes, 
  loadEducationTypes, 
  loadExperienceTypes,
  loadLocationTypes
} from "@/lib/data";

export default function JobPostings({ ciscoCode, unitTitle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdDate"); // createdDate | startDate | endDate | salary | employer
  const [sortOrder, setSortOrder] = useState("desc"); // asc | desc
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | closed
  const [showFilters, setShowFilters] = useState(false);

  const workTypes = useMemo(() => loadWorkTypes(), []);
  const eduTypes = useMemo(() => loadEducationTypes(), []);
  const expTypes = useMemo(() => loadExperienceTypes(), []);
  const locationTypes = useMemo(() => loadLocationTypes(), []);

  const jobPostings = useMemo(() => {
    return getJobPostingsByCiscoCode(ciscoCode);
  }, [ciscoCode]);

  const filteredAndSortedPostings = useMemo(() => {
    let filtered = jobPostings.filter(posting => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = posting.cTitle?.toLowerCase().includes(query);
        const matchesEmployer = posting.Employer?.toLowerCase().includes(query);
        const matchesIndustry = posting.sIndustry?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesEmployer && !matchesIndustry) return false;
      }

      // Status filter
      if (statusFilter === "active") return posting.isActive;
      if (statusFilter === "closed") return !posting.isActive;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case "createdDate":
          valueA = a.createdDate.getTime();
          valueB = b.createdDate.getTime();
          break;
        case "startDate":
          valueA = a.startDate.getTime();
          valueB = b.startDate.getTime();
          break;
        case "endDate":
          valueA = a.endDate.getTime();
          valueB = b.endDate.getTime();
          break;
        case "salary":
          valueA = a.fMeanSalary || 0;
          valueB = b.fMeanSalary || 0;
          break;
        case "employer":
          valueA = a.Employer || "";
          valueB = b.Employer || "";
          break;
        default:
          valueA = a.createdDate.getTime();
          valueB = b.createdDate.getTime();
      }

      if (typeof valueA === "string") {
        return sortOrder === "desc" ? valueB.localeCompare(valueA) : valueA.localeCompare(valueB);
      } else {
        return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
      }
    });

    return filtered;
  }, [jobPostings, searchQuery, sortBy, sortOrder, statusFilter]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (posting) => {
    if (posting["Salary Description"]) return posting["Salary Description"];
    if (posting.fMinSalary && posting.fMaxSalary) {
      return `${posting.Currency || 'CI$'} ${posting.fMinSalary.toLocaleString()} - ${posting.fMaxSalary.toLocaleString()}`;
    }
    if (posting.fMeanSalary) {
      return `${posting.Currency || 'CI$'} ${posting.fMeanSalary.toLocaleString()}`;
    }
    return "Salary not specified";
  };

  const getStatusBadge = (posting) => {
    if (posting.isActive) {
      return <Badge className="bg-green-500/20 text-green-300 border-green-300/30">Active</Badge>;
    }
    return <Badge className="bg-neutral-500/20 text-neutral-300 border-neutral-300/30">Closed</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Job Postings for {unitTitle}</h2>
          <p className="text-neutral-400">
            {filteredAndSortedPostings.length} of {jobPostings.length} total postings
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide' : 'Show'} Filters
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, employer, or industry..."
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>

        {showFilters && (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Postings</option>
                    <option value="active">Active Only</option>
                    <option value="closed">Closed Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="createdDate">Created Date</option>
                    <option value="startDate">Start Date</option>
                    <option value="endDate">End Date</option>
                    <option value="salary">Salary</option>
                    <option value="employer">Employer</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="secondary"
                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    className="gap-2 w-full"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    {sortOrder === "desc" ? "High to Low" : "Low to High"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job Postings Grid */}
      <div className="grid gap-4">
        {filteredAndSortedPostings.map((posting, index) => (
          <Card key={posting.cJobId || index} className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold group-hover:text-cyan-300 transition">
                      {posting.cTitle}
                    </h3>
                    {getStatusBadge(posting)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {posting.Employer}
                    </div>
                    {posting.sLocation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {locationTypes.get(posting.sLocation) || posting.sLocation}
                      </div>
                    )}
                    {posting["Hours Per Week"] && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {posting["Hours Per Week"]} hrs/week
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold mb-1">{formatSalary(posting)}</div>
                  <div className="text-sm text-neutral-400">
                    {workTypes.get(posting.sWork) || posting.sWork}
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Created</div>
                  <div className="text-sm font-medium">{formatDate(posting.createdDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Start Date</div>
                  <div className="text-sm font-medium">{formatDate(posting.startDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">End Date</div>
                  <div className="text-sm font-medium">{formatDate(posting.endDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Requirements</div>
                  <div className="text-sm">
                    {eduTypes.get(posting.sEducation) && expTypes.get(posting.sExperience) && (
                      <div className="flex gap-1">
                        <Badge className="bg-neutral-800 border-white/10 text-xs">
                          {eduTypes.get(posting.sEducation)}
                        </Badge>
                        <Badge className="bg-neutral-800 border-white/10 text-xs">
                          {expTypes.get(posting.sExperience)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Industry and Description */}
              {posting.sIndustry && (
                <div className="mb-4">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30">
                    {posting.sIndustry}
                  </Badge>
                  {posting["Sub-Industry"] && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-300/30 ml-2">
                      {posting["Sub-Industry"]}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Calendar className="w-4 h-4" />
                  <span>Job ID: {posting.cJobId}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Details
                  </Button>
                  
                  {posting.isActive && (
                    <Button 
                      size="sm" 
                      className="gap-2"
                      onClick={() => window.open(generateWORCSearchURL(posting), '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Apply on WORC
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedPostings.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-12 text-center">
            <div className="text-neutral-400 mb-4">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No job postings found</h3>
              <p>Try adjusting your search criteria or filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
