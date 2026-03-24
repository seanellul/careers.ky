"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_COLORS = {
  not_contacted: "bg-slate-600 text-slate-100",
  contacted: "bg-amber-600 text-amber-50",
  demo_scheduled: "bg-yellow-600 text-yellow-50",
  trial_active: "bg-blue-600 text-blue-50",
  paying: "bg-emerald-600 text-emerald-50",
  rejected: "bg-red-600 text-red-50",
};

export default function PipelineDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [employer, setEmployer] = useState(null);
  const [contactLog, setContactLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form state
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [nextFollowup, setNextFollowup] = useState("");
  const [responseReceived, setResponseReceived] = useState("");

  // Activity logging
  const [activityType, setActivityType] = useState("");
  const [activityNotes, setActivityNotes] = useState("");

  useEffect(() => {
    loadDetail();
  }, [id]);

  async function loadDetail() {
    try {
      const res = await fetch(`/api/admin/pipeline/${id}`);
      const data = await res.json();

      if (data.success) {
        setEmployer(data.data.employer);
        setContactLog(data.data.contactLog);

        // Set form initial values
        setStatus(data.data.employer.status);
        setNotes(data.data.employer.notes || "");
        setContactPerson(data.data.employer.contact_person || "");
        setContactEmail(data.data.employer.contact_email || "");
        setContactPhone(data.data.employer.contact_phone || "");
        setNextFollowup(data.data.employer.next_followup?.split("T")[0] || "");
        setResponseReceived(data.data.employer.response_received || "");
      }
    } catch (error) {
      console.error("Failed to load detail:", error);
      setMessage({ type: "error", text: "Failed to load employer details" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          contact_person: contactPerson,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          next_followup: nextFollowup ? `${nextFollowup}T00:00:00Z` : null,
          response_received: responseReceived,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEmployer(data.data);
        setMessage({ type: "success", text: "Changes saved successfully" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogActivity() {
    if (!activityType || !activityNotes.trim()) {
      setMessage({ type: "error", text: "Please select activity type and add notes" });
      return;
    }

    try {
      const res = await fetch(`/api/admin/pipeline/${id}/contact-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: activityType,
          notes: activityNotes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setContactLog([data.data, ...contactLog]);
        setActivityType("");
        setActivityNotes("");
        setMessage({
          type: "success",
          text: "Activity logged successfully",
        });
        setTimeout(() => setMessage(null), 3000);
        // Reload to get updated last_contacted
        await loadDetail();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to log activity" });
      }
    } catch (error) {
      console.error("Failed to log activity:", error);
      setMessage({ type: "error", text: "Failed to log activity" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={32} className="animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-neutral-500 dark:text-neutral-400">Employer not found</p>
        <Link href="/admin/pipeline" className="text-primary-500 hover:text-primary-500 mt-4 inline-block">
          Back to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/pipeline"
            className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            Back to Pipeline
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{employer.employer_name}</h1>
          <div className="text-neutral-500 dark:text-neutral-400 mt-2">
            <div>
              <strong>Rank:</strong> #{employer.priority_rank} • <strong>Score:</strong>{" "}
              {employer.score}/100 • <strong>Segment:</strong> {employer.segment}
            </div>
            <div className="mt-1">
              <strong>Industry:</strong> {employer.industry}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-100"
              : "bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-100"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employer Info Card */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Employer Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase mb-1">
                  Total Jobs (Last Year)
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {employer.total_jobs}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase mb-1">
                  Active Jobs
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {employer.active_jobs}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase mb-1">
                  Average Salary
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {employer.avg_salary
                    ? `$${employer.avg_salary.toLocaleString()}`
                    : "N/A"}
                </div>
              </div>
              <div>
                <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase mb-1">
                  Recommended Tier
                </div>
                <div className="text-lg font-semibold text-primary-500">
                  {employer.recommended_tier}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase mb-2">
                Suggested Hook
              </div>
              <p className="text-neutral-900 dark:text-white text-sm leading-relaxed">
                {employer.suggested_hook}
              </p>
            </div>
          </div>

          {/* Status & Contact Info */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Sales Information
            </h2>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded border-0 font-medium cursor-pointer ${
                    STATUS_COLORS[status]
                  }`}
                >
                  <option value="not_contacted">Not Contacted</option>
                  <option value="contacted">Contacted</option>
                  <option value="demo_scheduled">Demo Scheduled</option>
                  <option value="trial_active">Trial Active</option>
                  <option value="paying">Paying</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Name of contact"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase mb-2 flex items-center gap-2">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@company.com"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase mb-2 flex items-center gap-2">
                  <Phone size={14} /> Phone
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (123) 456-7890"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Next Followup */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Next Followup
                </label>
                <input
                  type="date"
                  value={nextFollowup}
                  onChange={(e) => setNextFollowup(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Response Received */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase mb-2">
                  Response Received
                </label>
                <textarea
                  value={responseReceived}
                  onChange={(e) => setResponseReceived(e.target.value)}
                  placeholder="What did they respond with?"
                  rows="3"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this employer..."
              rows="5"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded font-semibold text-white transition-colors"
          >
            {saving ? (
              <>
                <Loader size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Last Activity */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} />
              Last Activity
            </h3>
            {employer.last_contacted ? (
              <div className="text-sm">
                <div className="text-neutral-500 dark:text-neutral-400">
                  {new Date(employer.last_contacted).toLocaleDateString()}{" "}
                  {new Date(employer.last_contacted).toLocaleTimeString()}
                </div>
              </div>
            ) : (
              <div className="text-neutral-500 text-sm">No contact yet</div>
            )}

            {employer.next_followup && (
              <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Next Followup:</div>
                <div className="text-neutral-900 dark:text-white">
                  {new Date(employer.next_followup).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Log Activity */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Log Activity</h3>

            <div className="space-y-3">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Select activity...</option>
                <option value="email_sent">Email Sent</option>
                <option value="call_made">Call Made</option>
                <option value="response_received">Response Received</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="meeting_completed">Meeting Completed</option>
                <option value="trial_started">Trial Started</option>
                <option value="payment_received">Payment Received</option>
              </select>

              <textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Notes about this interaction..."
                rows="3"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 text-sm"
              />

              <button
                onClick={handleLogActivity}
                className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 rounded text-white font-medium transition-colors"
              >
                Log Activity
              </button>
            </div>
          </div>

          {/* Contact Log */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Contact History</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {contactLog.length === 0 ? (
                <div className="text-neutral-500 text-sm">No activity yet</div>
              ) : (
                contactLog.map((log) => (
                  <div
                    key={log.id}
                    className="text-sm border-l-2 border-neutral-300 dark:border-neutral-600 pl-3 py-2"
                  >
                    <div className="font-medium text-neutral-700 dark:text-neutral-300">
                      {log.activity_type.replace(/_/g, " ")}
                    </div>
                    {log.notes && (
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">
                        {log.notes}
                      </div>
                    )}
                    <div className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                      {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
