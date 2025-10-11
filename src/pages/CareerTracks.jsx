import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BookOpen,
  Briefcase,
  ArrowUpDown,
  Eye
} from "lucide-react";
import { buildCiscoTree, loadAggregates, loadWorkTypes, loadEducationTypes, loadExperienceTypes, searchTitles } from "@/lib/data";

export default function CareerTracks({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedSubMajor, setSelectedSubMajor] = useState(null);
  const [selectedMinor, setSelectedMinor] = useState(null);
  const [viewMode, setViewMode] = useState("tree"); // tree | market
  const [sortBy, setSortBy] = useState("count"); // count | min | max | mean
  const [sortOrder, setSortOrder] = useState("desc"); // asc | desc
  const [filters, setFilters] = useState({
    education: "",
    experience: "",
    workType: ""
  });

  const tree = useMemo(() => {
    try {
      const treeData = buildCiscoTree();
      console.log('Tree built successfully:', treeData);
      return treeData;
    } catch (error) {
      console.error('Error building tree:', error);
      return { id: "root", title: "Occupations", children: [] };
    }
  }, []);
  const aggregates = useMemo(() => loadAggregates(), []);
  const workTypes = useMemo(() => loadWorkTypes(), []);
  const eduTypes = useMemo(() => loadEducationTypes(), []);
  const expTypes = useMemo(() => loadExperienceTypes(), []);

  // Get all units for market view
  const allUnits = useMemo(() => {
    const units = [];
    const visited = new Set();
    
    const traverse = (node, depth = 0) => {
      if (!node || visited.has(node.id)) return; // Prevent infinite loops
      if (depth > 10) return; // Prevent deep recursion
      
      visited.add(node.id);
      
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => {
          if (child && child.id && child.id.length === 4 && child.id !== "root") { // CISCO unit (4 digits)
            units.push(child);
          }
          traverse(child, depth + 1);
        });
      }
    };
    
    traverse(tree);
    console.log('Found units:', units.length);
    return units;
  }, [tree]);

  // Filter and sort units for market view
  const filteredUnits = useMemo(() => {
    let filtered = allUnits.filter(unit => {
      const stats = aggregates.get(unit.id);
      if (!stats) return false;
      
      if (filters.education && !stats.dist?.edu?.[filters.education]) return false;
      if (filters.experience && !stats.dist?.exp?.[filters.experience]) return false;
      if (filters.workType && !stats.dist?.work?.[filters.workType]) return false;
      
      return true;
    });

    // Sort by selected criteria
    filtered.sort((a, b) => {
      const statsA = aggregates.get(a.id);
      const statsB = aggregates.get(b.id);
      
      let valueA, valueB;
      switch (sortBy) {
        case "count": valueA = statsA.count; valueB = statsB.count; break;
        case "min": valueA = statsA.min; valueB = statsB.min; break;
        case "max": valueA = statsA.max; valueB = statsB.max; break;
        case "mean": valueA = statsA.mean; valueB = statsB.mean; break;
        default: valueA = statsA.count; valueB = statsB.count;
      }
      
      return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
    });

    return filtered;
  }, [allUnits, aggregates, filters, sortBy, sortOrder]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTitles(searchQuery, 20);
  }, [searchQuery]);

  const clearFilters = () => {
    setFilters({ education: "", experience: "", workType: "" });
    setSelectedMajor(null);
    setSelectedSubMajor(null);
    setSelectedMinor(null);
  };

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
            <span className="font-semibold tracking-tight">Career <span className="text-cyan-300">Tracks</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => window.history.back()}>Back to Home</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Explore <span className="text-cyan-300">Career Opportunities</span> in Cayman
          </h1>
          <p className="text-neutral-300 text-lg max-w-3xl">
            Discover the complete job market in Cayman through our comprehensive CISCO taxonomy. 
            Find roles by industry, salary ranges, and requirements.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job titles, occupations, or industries..."
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={viewMode === "tree" ? "default" : "secondary"}
                onClick={() => setViewMode("tree")}
                className="gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Browse by Industry
              </Button>
              <Button 
                variant={viewMode === "market" ? "default" : "secondary"}
                onClick={() => setViewMode("market")}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Market Analytics
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Search Results ({searchResults.length})</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {searchResults.map((result, i) => (
                    <button 
                      key={i}
                      className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-300/40 transition"
                    >
                      <div className="font-medium">{result.cTitle}</div>
                      <div className="text-sm text-neutral-400">Occupation #{result.sOccupation}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market View Filters */}
          {viewMode === "market" && (
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <select 
                    value={filters.education}
                    onChange={(e) => setFilters(prev => ({ ...prev, education: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="">All Education Levels</option>
                    {Array.from(eduTypes.entries()).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  <select 
                    value={filters.experience}
                    onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="">All Experience Levels</option>
                    {Array.from(expTypes.entries()).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  <select 
                    value={filters.workType}
                    onChange={(e) => setFilters(prev => ({ ...prev, workType: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="">All Work Types</option>
                    {Array.from(workTypes.entries()).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>

                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Sort by:</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm"
                    >
                      <option value="count">Job Posts</option>
                      <option value="min">Min Salary</option>
                      <option value="max">Max Salary</option>
                      <option value="mean">Average Salary</option>
                    </select>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                    className="gap-2"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    {sortOrder === "desc" ? "High to Low" : "Low to High"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        {viewMode === "tree" ? (
          <TaxonomyTreeView 
            tree={tree}
            aggregates={aggregates}
            selectedMajor={selectedMajor}
            setSelectedMajor={setSelectedMajor}
            selectedSubMajor={selectedSubMajor}
            setSelectedSubMajor={setSelectedSubMajor}
            selectedMinor={selectedMinor}
            setSelectedMinor={setSelectedMinor}
          />
        ) : (
          <MarketAnalyticsView 
            units={filteredUnits}
            aggregates={aggregates}
            workTypes={workTypes}
            eduTypes={eduTypes}
            expTypes={expTypes}
          />
        )}
      </div>
    </div>
  );
}

function TaxonomyTreeView({ tree, aggregates, selectedMajor, setSelectedMajor, selectedSubMajor, setSelectedSubMajor, selectedMinor, setSelectedMinor }) {
  const majors = tree.children || [];
  
  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Major Categories */}
      <div className="lg:col-span-1">
        <h3 className="font-semibold mb-4">Industry Categories</h3>
        <div className="space-y-2">
          {majors.map((major) => (
            <button
              key={major.id}
              onClick={() => {
                setSelectedMajor(major);
                setSelectedSubMajor(null);
                setSelectedMinor(null);
              }}
              className={`w-full text-left p-3 rounded-xl transition ${
                selectedMajor?.id === major.id 
                  ? "bg-cyan-400/15 text-cyan-200 border border-cyan-400/30" 
                  : "bg-white/5 border border-white/10 hover:border-white/20"
              }`}
            >
              <div className="font-medium">{major.title}</div>
              <div className="text-sm text-neutral-400">{major.children?.length || 0} subcategories</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-major Categories */}
      {selectedMajor && (
        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-4">Subcategories</h3>
          <div className="space-y-2">
            {selectedMajor.children?.map((subMajor) => (
              <button
                key={subMajor.id}
                onClick={() => {
                  setSelectedSubMajor(subMajor);
                  setSelectedMinor(null);
                }}
                className={`w-full text-left p-3 rounded-xl transition ${
                  selectedSubMajor?.id === subMajor.id 
                    ? "bg-emerald-400/15 text-emerald-200 border border-emerald-400/30" 
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                }`}
              >
                <div className="font-medium">{subMajor.title}</div>
                <div className="text-sm text-neutral-400">{subMajor.children?.length || 0} specializations</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Minor Categories */}
      {selectedSubMajor && (
        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-4">Specializations</h3>
          <div className="space-y-2">
            {selectedSubMajor.children?.map((minor) => (
              <button
                key={minor.id}
                onClick={() => setSelectedMinor(minor)}
                className={`w-full text-left p-3 rounded-xl transition ${
                  selectedMinor?.id === minor.id 
                    ? "bg-purple-400/15 text-purple-200 border border-purple-400/30" 
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                }`}
              >
                <div className="font-medium">{minor.title}</div>
                <div className="text-sm text-neutral-400">{minor.children?.length || 0} roles</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CISCO Units */}
      {selectedMinor && (
        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-4">Specific Roles</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {selectedMinor.children?.map((unit) => {
              const stats = aggregates.get(unit.id);
              return (
                <Card 
                  key={unit.id} 
                  className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition cursor-pointer"
                  onClick={() => onNavigate?.('job-detail', unit.id)}
                >
                  <CardContent className="p-3">
                    <div className="font-medium mb-1">{unit.title}</div>
                    {stats && (
                      <div className="flex gap-2 text-xs">
                        <Badge className="bg-neutral-800">{stats.count} posts</Badge>
                        <Badge className="bg-emerald-800">CI$ {Math.round(stats.mean).toLocaleString()}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketAnalyticsView({ units, aggregates, workTypes, eduTypes, expTypes }) {
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
    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {units.map((unit) => {
        const stats = aggregates.get(unit.id);
        if (!stats) return null;

        return (
          <Card key={unit.id} className="bg-white/5 border-white/10 hover:border-cyan-300/40 transition group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-cyan-300 transition">
                    {unit.title}
                  </h3>
                  <p className="text-sm text-neutral-400 line-clamp-2">{unit.description}</p>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-300/30">
                  {unit.id}
                </Badge>
              </div>

              {/* Salary Stats */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Salary Range
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-400">Min</div>
                    <div className="font-medium">CI$ {Math.round(stats.min).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Avg</div>
                    <div className="font-medium">CI$ {Math.round(stats.mean).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-neutral-400">Max</div>
                    <div className="font-medium">CI$ {Math.round(stats.max).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Job Market Stats */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Market Overview ({stats.count} posts)
                </div>
                
                {stats.dist && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-neutral-400 mb-1">Work Types</div>
                      <div className="space-y-1">
                        {Object.entries(stats.dist.work).slice(0, 3).map(([k, v]) => (
                          <Bar key={k} label={workTypes.get(k) || k} value={v} total={stats.count} color="bg-emerald-400" />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-400 mb-1">Education Levels</div>
                      <div className="space-y-1">
                        {Object.entries(stats.dist.edu).slice(0, 3).map(([k, v]) => (
                          <Bar key={k} label={eduTypes.get(k) || k} value={v} total={stats.count} color="bg-purple-400" />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-neutral-400 mb-1">Experience Levels</div>
                      <div className="space-y-1">
                        {Object.entries(stats.dist.exp).slice(0, 3).map(([k, v]) => (
                          <Bar key={k} label={expTypes.get(k) || k} value={v} total={stats.count} color="bg-orange-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button 
                className="w-full gap-2"
                onClick={() => onNavigate?.('job-detail', unit.id)}
              >
                <Eye className="w-4 h-4" />
                View Details
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
