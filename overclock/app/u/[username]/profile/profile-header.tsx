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
    <section className="overflow-hidden rounded-2xl border border-[#d7dee8] bg-[#ffffff]">
      <div className="pb-6">
        <div className="h-28 bg-[#f6ead7]" />

        <div className="-mt-10 px-5">
          <div className="w-fit">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${displayName} avatar`}
                className="h-24 w-24 rounded-full border-4 border-[#ffffff] bg-[#fde2b2] object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#ffffff] bg-[#fde2b2] text-3xl font-semibold text-[#111827]">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 px-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold leading-6 tracking-tight text-[#111827]">
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
          <p className="mt-1 text-[15px] leading-5 text-[#4b5563]">@{username}</p>
          <p className="max-w-2xl text-[15px] leading-6 text-[#1f2937]">
            {bio || "This player has not added a bio yet."}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 px-5">
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#d7dee8] bg-[#f7f9fc] px-3 text-[13px] font-semibold leading-none text-[#111827]">
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
              className="inline-flex h-8 items-center rounded-full border border-[#d7dee8] bg-[#f7f9fc] px-3 text-[13px] font-semibold leading-none text-[#111827]"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
