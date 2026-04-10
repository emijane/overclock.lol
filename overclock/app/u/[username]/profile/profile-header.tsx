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
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="h-32 bg-[radial-gradient(circle_at_20%_20%,rgba(212,212,216,0.18),transparent_32%),linear-gradient(135deg,#18181b,#09090b)]" />
      <div className="px-5 pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-24 w-24 rounded-full border-4 border-black object-cover shadow-xl shadow-black/40"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-black bg-zinc-900 text-3xl font-semibold text-zinc-200 shadow-xl shadow-black/40">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-12 sm:pt-14">
            <button
              type="button"
              className="h-9 rounded-full border border-zinc-700 px-4 text-sm font-bold text-white transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Message
            </button>
            <button
              type="button"
              className="h-9 rounded-full bg-zinc-100 px-4 text-sm font-bold text-black transition hover:bg-white"
            >
              Follow
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold leading-6 tracking-tight text-white">
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
          <p className="text-[15px] leading-5 text-zinc-500">@{username}</p>
          <p className="mt-3.5 max-w-2xl text-[15px] leading-6 text-zinc-200">
            {bio || "This player has not added a bio yet."}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-[13px] font-semibold leading-none text-zinc-100">
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
              className="inline-flex h-8 items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 text-[13px] font-semibold leading-none text-zinc-100"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
