"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import t from "@/lib/theme";
import {
  Search,
  ChevronRight,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  BookOpen,
  Briefcase,
  ArrowUpDown,
  Eye,
} from "lucide-react";

export default function CareerTracksClient({
  tree,
  aggregates: aggObj,
  workTypes: wtObj,
  eduTypes: etObj,
  expTypes: exObj,
  embedded = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const aggregates = useMemo(() => new Map(Object.entries(aggObj)), [aggObj]);
  const workTypes = useMemo(() => new Map(Object.entries(wtObj)), [wtObj]);
  const eduTypes = useMemo(() => new Map(Object.entries(etObj)), [etObj]);
  const expTypes = useMemo(() => new Map(Object.entries(exObj)), [exObj]);

  const initialQuery = searchParams.get("q") || "";
  const initialCisco = searchParams.get("cisco") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedSubMajor, setSelectedSubMajor] = useState(null);
  const [selectedMinor, setSelectedMinor] = useState(null);
  const [viewMode, setViewMode] = useState("market");
  const [sortBy, setSortBy] = useState("count");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCiscoCodes, setSelectedCiscoCodes] = useState(
    initialCisco ? new Set([initialCisco]) : new Set()
  );
  const [filters, setFilters] = useState({ education: "", experience: "", workType: "" });
  const [suggestions, setSuggestions] = useState([]);

  // Search for suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.suggestions || []).filter((s) => {
          const stats = aggregates.get(s.sCISCO);
          return stats && stats.count > 0;
        });
        setSuggestions(filtered);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [searchQuery, aggregates]);

  // All unit-level nodes
  const allUnits = useMemo(() => {
    const units = [];
    const visited = new Set();
    const traverse = (node, depth = 0) => {
      if (!node || visited.has(node.id)) return;
      if (depth > 10) return;
      visited.add(node.id);
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => {
          if (child && child.id && child.id.length === 4 && child.id !== "root") {
            units.push(child);
          }
          traverse(child, depth + 1);
        });
      }
    };
    traverse(tree);
    return units;
  }, [tree]);

  const filteredUnits = useMemo(() => {
    let filtered = allUnits.filter((unit) => {
      const stats = aggregates.get(unit.id);
      if (!stats) return false;
      if (selectedCiscoCodes.size > 0 && !selectedCiscoCodes.has(unit.id)) return false;
      if (filters.education && !stats.dist?.edu?.[filters.education]) return false;
      if (filters.experience && !stats.dist?.exp?.[filters.experience]) return false;
      if (filters.workType && !stats.dist?.work?.[filters.workType]) return false;
      return true;
    });

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
  }, [allUnits, aggregates, filters, sortBy, sortOrder, selectedCiscoCodes]);

  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  const visibleUnits = filteredUnits.slice(0, page * PAGE_SIZE);
  const hasMore = visibleUnits.length < filteredUnits.length;

  // Reset page when filters/sort change
  const resetPage = useCallback(() => setPage(1), []);
  useEffect(() => { resetPage(); }, [filters, sortBy, sortOrder, selectedCiscoCodes, resetPage]);

  const clearFilters = () => {
    setFilters({ education: "", experience: "", workType: "" });
    setSelectedCiscoCodes(new Set());
    setSearchQuery("");
    setSelectedMajor(null);
    setSelectedSubMajor(null);
    setSelectedMinor(null);
  };

  const toggleCiscoCode = (code) => {
    setSelectedCiscoCodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(code)) newSet.delete(code);
      else newSet.add(code);
      return newSet;
    });
  };

  const Bar = ({ label, value, total, color = "bg-primary-300" }) => (
    <div className="flex items-center gap-2">
      <div className="w-16 sm:w-32 text-xs text-neutral-600 dark:text-neutral-400 truncate" title={label}>{label}</div>
      <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.round((value / Math.max(1, total)) * 100)}%` }} />
      </div>
      <div className="w-12 sm:w-16 text-xs text-neutral-500 text-right">{Math.round((value / Math.max(1, total)) * 100)}%</div>
    </div>
  );

  const content = (
    <div className={embedded ? "" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"}>
        <div className="mb-8">
          <h1 className="text-4xl font-semibold tracking-tight mb-4">
            Explore <span className="text-primary-500">Career Opportunities</span> in Cayman
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg max-w-3xl">
            Discover the complete job market in Cayman through our comprehensive CISCO taxonomy. Find roles by industry, salary ranges, and requirements.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job titles, occupations, or industries..."
                className="pl-10 bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "market" ? "default" : "secondary"}
                onClick={() => setViewMode("market")}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Market Analytics
              </Button>
              <Button
                variant={viewMode === "tree" ? "default" : "secondary"}
                onClick={() => setViewMode("tree")}
                className="gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Browse by Industry
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && suggestions.length > 0 && (
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">
                  Search Results ({suggestions.length})
                  {selectedCiscoCodes.size > 0 && (
                    <span className="text-primary-500 ml-2">· {selectedCiscoCodes.size} selected</span>
                  )}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {suggestions.map((result, i) => {
                    const isSelected = selectedCiscoCodes.has(result.sCISCO);
                    return (
                      <button
                        key={i}
                        onClick={() => toggleCiscoCode(result.sCISCO)}
                        className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-primary-50 dark:bg-primary-500/15 border-primary-500 ring-2 ring-primary-200"
                            : "bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 hover:border-primary-300 hover:bg-primary-50 dark:bg-primary-500/15"
                        }`}
                      >
                        <div className="font-medium flex items-center justify-between">
                          <span>{result.label}</span>
                          {isSelected && <Badge className="bg-primary-500 text-white text-xs">✓</Badge>}
                        </div>
                        <div className="text-sm text-neutral-500">CISCO Code: {result.sCISCO}</div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market View Filters */}
          {viewMode === "market" && (
            <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  {selectedCiscoCodes.size > 0 && (
                    <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30">
                      {selectedCiscoCodes.size} job{selectedCiscoCodes.size !== 1 ? "s" : ""} selected
                    </Badge>
                  )}
                  <select value={filters.education} onChange={(e) => setFilters((p) => ({ ...p, education: e.target.value }))} className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 h-10 text-sm">
                    <option value="">All Education Levels</option>
                    {Array.from(eduTypes.entries()).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <select value={filters.experience} onChange={(e) => setFilters((p) => ({ ...p, experience: e.target.value }))} className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 h-10 text-sm">
                    <option value="">All Experience Levels</option>
                    {Array.from(expTypes.entries()).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <select value={filters.workType} onChange={(e) => setFilters((p) => ({ ...p, workType: e.target.value }))} className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 h-10 text-sm">
                    <option value="">All Work Types</option>
                    {Array.from(workTypes.entries()).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <Button variant="secondary" size="sm" onClick={clearFilters}>Clear All</Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Sort by:</span>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 h-10 text-sm">
                      <option value="count">Job Posts</option>
                      <option value="min">Min Salary</option>
                      <option value="max">Max Salary</option>
                      <option value="mean">Average Salary</option>
                    </select>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))} className="gap-2">
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
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Industry Categories</h3>
              <div className="space-y-2">
                {(tree.children || []).map((major) => (
                  <button
                    key={major.id}
                    onClick={() => { setSelectedMajor(major); setSelectedSubMajor(null); setSelectedMinor(null); }}
                    className={`w-full text-left p-3 rounded-xl transition ${selectedMajor?.id === major.id ? "bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/30" : "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"}`}
                  >
                    <div className="font-medium">{major.title}</div>
                    <div className="text-sm text-neutral-500">{major.children?.length || 0} subcategories</div>
                  </button>
                ))}
              </div>
            </div>
            {selectedMajor && (
              <div className="lg:col-span-1">
                <h3 className="font-semibold mb-4">Subcategories</h3>
                <div className="space-y-2">
                  {selectedMajor.children?.map((subMajor) => (
                    <button key={subMajor.id} onClick={() => { setSelectedSubMajor(subMajor); setSelectedMinor(null); }}
                      className={`w-full text-left p-3 rounded-xl transition ${selectedSubMajor?.id === subMajor.id ? "bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/30" : "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"}`}
                    >
                      <div className="font-medium">{subMajor.title}</div>
                      <div className="text-sm text-neutral-500">{subMajor.children?.length || 0} specializations</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedSubMajor && (
              <div className="lg:col-span-1">
                <h3 className="font-semibold mb-4">Specializations</h3>
                <div className="space-y-2">
                  {selectedSubMajor.children?.map((minor) => (
                    <button key={minor.id} onClick={() => setSelectedMinor(minor)}
                      className={`w-full text-left p-3 rounded-xl transition ${selectedMinor?.id === minor.id ? "bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/30" : "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"}`}
                    >
                      <div className="font-medium">{minor.title}</div>
                      <div className="text-sm text-neutral-500">{minor.children?.length || 0} roles</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedMinor && (
              <div className="lg:col-span-1">
                <h3 className="font-semibold mb-4">Specific Roles</h3>
                <div className="space-y-2 max-h-[350px] sm:max-h-[600px] overflow-y-auto">
                  {selectedMinor.children?.map((unit) => {
                    const stats = aggregates.get(unit.id);
                    return (
                      <Link key={unit.id} href={`/job/${unit.id}`}>
                        <Card className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 hover:border-primary-300 transition cursor-pointer">
                          <CardContent className="p-3">
                            <div className="font-medium mb-1">{unit.title}</div>
                            {stats && (
                              <div className="flex gap-2 text-xs">
                                <Badge className="bg-white dark:bg-neutral-800 shadow-sm">{stats.count} posts</Badge>
                                <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-500/30">CI$ {Math.round(stats.mean).toLocaleString()}</Badge>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {visibleUnits.map((unit) => {
                const stats = aggregates.get(unit.id);
                if (!stats) return null;
                return (
                  <Card key={unit.id} className="bg-white dark:bg-neutral-800 shadow-sm border-neutral-200 dark:border-neutral-700 hover:border-primary-300 transition group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base mb-1 group-hover:text-primary-500 transition line-clamp-2">{unit.title.replace(/\s+not elsewhere classified$/i, "")}</h3>
                          <p className="text-xs text-neutral-500 line-clamp-2">{unit.description}</p>
                        </div>
                        <Badge className="bg-primary-50 dark:bg-primary-500/15 text-primary-500 border-primary-200 dark:border-primary-500/30 ml-2 shrink-0">{unit.id}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs mb-4 px-3 py-2 bg-white dark:bg-neutral-800 shadow-sm rounded-lg">
                        <DollarSign className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                        <span className="text-neutral-500">CI$ {Math.round(stats.min).toLocaleString()}</span>
                        <span className="text-neutral-600 dark:text-neutral-400">—</span>
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">CI$ {Math.round(stats.mean).toLocaleString()}</span>
                        <span className="text-neutral-600 dark:text-neutral-400">—</span>
                        <span className="text-neutral-500">CI$ {Math.round(stats.max).toLocaleString()}</span>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Market Overview ({stats.count} posts)</div>
                        {stats.dist && (
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Work Types</div>
                              <div className="space-y-1">
                                {Object.entries(stats.dist.work).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k, v]) => (
                                  <Bar key={k} label={workTypes.get(k) || k} value={v} total={stats.count} color="bg-primary-300" />
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Education Levels</div>
                              <div className="space-y-1">
                                {Object.entries(stats.dist.edu).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k, v]) => (
                                  <Bar key={k} label={eduTypes.get(k) || k} value={v} total={stats.count} color="bg-primary-200" />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Link href={`/job/${unit.id}`}>
                        <Button className="w-full gap-2"><Eye className="w-4 h-4" /> View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button variant="secondary" onClick={() => setPage((p) => p + 1)} className="gap-2 px-8">
                  Show More ({filteredUnits.length - visibleUnits.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className={`${t.page} w-full`}>
      <div
        id="bg-gradient"
        aria-hidden
        className="fixed inset-0 -z-10 bg-[length:200%_200%]"
        style={t.pageGradientStyle}
      />
      {content}
    </div>
  );
}
