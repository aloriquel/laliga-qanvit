"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import FollowEmailModal from "./FollowEmailModal";
import { track } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";

type Props = {
  slug: string;
  startupName: string;
  initialVoteCount: number;
  initialFollowerCount: number;
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const row = document.cookie.split("; ").find((r) => r.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const exp = new Date();
  exp.setDate(exp.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp.toUTCString()}; path=/; SameSite=Lax`;
}

export default function AnonymousVoteButton({
  slug,
  startupName,
  initialVoteCount,
  initialFollowerCount,
}: Props) {
  const votedKey = `qanvit_voted_${slug}`;
  const followModalKey = `qanvit_follow_modal_shown_${slug}`;

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [followerCount] = useState(initialFollowerCount);
  const [voted, setVoted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (readCookie(votedKey)) setVoted(true);
  }, [votedKey]);

  async function handleVote() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/startups/${encodeURIComponent(slug)}/anonymous-vote`, {
        method: "POST",
      });
      if (res.status === 429) {
        setLoading(false);
        return;
      }
      const data: { voted?: boolean; already?: boolean; count?: number } = await res.json().catch(() => ({}));
      if (data.voted) {
        const newCount = typeof data.count === "number" ? data.count : voteCount + 1;
        setVoteCount(newCount);
        setVoted(true);
        setCookie(votedKey, "1", 1);
        track(EVENTS.ANONYMOUS_VOTE_CLICKED, {
          startup_slug: slug,
          vote_count_after: newCount,
        });
        if (!readCookie(followModalKey)) {
          setModalOpen(true);
          setCookie(followModalKey, "1", 30);
          track(EVENTS.FOLLOW_MODAL_OPENED, {
            startup_slug: slug,
            trigger: "after_vote",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={handleVote}
          disabled={voted || loading}
          aria-label={voted ? "Ya has votado" : `Apoyar ${startupName}`}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-body text-sm font-semibold transition-colors ${
            voted
              ? "bg-brand-salmon/20 text-brand-navy cursor-default"
              : "bg-brand-navy text-white hover:bg-brand-navy/90"
          }`}
        >
          <Heart size={16} className={voted ? "fill-brand-salmon text-brand-salmon" : ""} />
          <span>{voted ? "Ya votaste" : "Apoyar"}</span>
          <span className="font-mono text-xs opacity-80">· {voteCount}</span>
        </button>
        <span className="font-body text-xs text-ink-secondary">
          📧 {followerCount} {followerCount === 1 ? "siguiendo" : "siguiendo"}
        </span>
      </div>

      <FollowEmailModal
        slug={slug}
        startupName={startupName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
