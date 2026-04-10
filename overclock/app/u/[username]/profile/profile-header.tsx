import Image from "next/image";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  bio: string | null;
  currentRank: string | null;
  currentRankIconSrc: string | null;
  currentRankPill: string;
  displayName: string;
  username: string;
};

const rolePillTemplate = ["Tank", "DPS", "Support"] as const;

export function ProfileHeader({
  avatarUrl,
  bio,
  currentRank,
  currentRankIconSrc,
  currentRankPill,
  displayName,
  username,
}: ProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#3b4657] bg-[#1a1f27] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="h-32 bg-[radial-gradient(circle_at_16%_18%,rgba(249,158,26,0.30),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(0,174,240,0.18),transparent_22%),linear-gradient(135deg,#444b57_0%,#242b35_48%,#171c23_100%)]" />
      <div className="px-5 pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-24 w-24 rounded-full border-4 border-[#161b21] object-cover shadow-xl shadow-black/30"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#161b21] bg-[#2a313d] text-3xl font-semibold text-[#f5f7fa] shadow-xl shadow-black/30">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-12 sm:pt-14">
            <button
              type="button"
              className="h-9 rounded-full border border-[#546174] bg-[#212833] px-4 text-sm font-bold text-[#f5f7fa] transition hover:border-[#6a7b91] hover:bg-[#28313d]"
            >
              Message
            </button>
            <button
              type="button"
              className="h-9 rounded-full bg-[#f99e1a] px-4 text-sm font-bold text-[#171b22] transition hover:bg-[#ffb347]"
            >
              Follow
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold leading-6 tracking-tight text-[#f7fafc]">
              {displayName}
            </h1>
            {currentRankIconSrc && currentRank ? (
              <Image
                src={currentRankIconSrc}
                alt={`${currentRank} rank icon`}
                width={44}
                height={44}
                className="h-6 w-6 object-contain"
              />
            ) : null}
          </div>
          <p className="text-[15px] leading-5 text-[#8ea0b8]">@{username}</p>
          <p className="mt-3.5 max-w-2xl text-[15px] leading-6 text-[#eef2f7]">
            {bio || "This player has not added a bio yet."}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#546174] bg-[#212833] px-3 text-[13px] font-semibold leading-none text-[#f5f7fa]">
            {currentRankIconSrc && currentRank ? (
              <Image
                src={currentRankIconSrc}
                alt={`${currentRank} rank icon`}
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 object-contain"
              />
            ) : null}
            {currentRankPill}
          </span>
          {rolePillTemplate.map((role) => (
            <span
              key={role}
              className="inline-flex h-8 items-center rounded-full border border-[#546174] bg-[#212833] px-3 text-[13px] font-semibold leading-none text-[#f5f7fa]"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
