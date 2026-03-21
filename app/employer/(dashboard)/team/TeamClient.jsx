"use client";

import { useState } from "react";
import { Users2, UserPlus, Trash2, Shield, Loader2, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TeamClient({ members: initialMembers, invitations: initialInvitations, currentAccountId, currentRole }) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send invitation");
        return;
      }
      setInvitations((prev) => [data.invitation, ...prev]);
      setInviteEmail("");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm("Remove this team member? They will lose access to the employer dashboard.")) return;
    setProcessing(memberId);
    try {
      const res = await fetch("/api/employer/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setProcessing(memberId);
    try {
      const res = await fetch("/api/employer/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (res.ok) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      }
    } finally {
      setProcessing(null);
    }
  };

  const roleBadge = (role) => {
    const styles = {
      owner: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      admin: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      member: "bg-white/10 text-neutral-300 border-white/10",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[role] || styles.member}`}>
        {role}
      </span>
    );
  };

  const verificationBadge = (status) => {
    if (status === "verified") return <span className="text-xs text-emerald-400">Verified</span>;
    if (status === "pending") return <span className="text-xs text-amber-400">Pending</span>;
    return <span className="text-xs text-neutral-500">{status}</span>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Users2 className="w-6 h-6 text-cyan-300" />
        <h1 className="text-2xl font-semibold">Team Management</h1>
      </div>

      {/* Current members */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Team Members</h2>
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 grid place-items-center shrink-0">
              <span className="text-sm font-semibold text-neutral-300">
                {(member.name || member.email)[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{member.name || "Unnamed"}</span>
                {roleBadge(member.role)}
                {verificationBadge(member.verification_status)}
                {member.id === currentAccountId && (
                  <span className="text-xs text-neutral-500">(you)</span>
                )}
              </div>
              <p className="text-sm text-neutral-400 truncate">{member.email}</p>
            </div>

            {currentRole === "owner" && member.id !== currentAccountId && member.role !== "owner" && (
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={processing === member.id}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-neutral-200"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(member.id)}
                  disabled={processing === member.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {processing === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Pending Invitations</h2>
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 grid place-items-center shrink-0">
                <Mail className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{inv.email}</span>
                  {roleBadge(inv.role)}
                </div>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires {new Date(inv.expires_at).toLocaleDateString()}
                  {inv.invited_by_name && ` · Invited by ${inv.invited_by_name}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-cyan-300" />
          <h2 className="text-lg font-medium">Invite Team Member</h2>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex gap-3">
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="bg-white/5 border-white/10 flex-1"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-neutral-200"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" disabled={inviting} className="gap-2">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invite
          </Button>
        </form>
      </div>
    </div>
  );
}
