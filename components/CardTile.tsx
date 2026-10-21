import { CollectionControls } from "@/components/CollectionControls";
import type { OwnedCounts } from "@/lib/collection-types";
import { cardImageUrl, cardTitle, type SwuCard } from "@/lib/swu-api";

export function CardTile({ card, owned }: { card: SwuCard; owned: OwnedCounts }) {
  const landscape = card.Type === "Leader" || card.Type === "Base";
  const title = cardTitle(card);
  const alt = `${title}, ${card.Set} ${card.Number}`;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
      <div
        className={`relative w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900 ${
          landscape ? "aspect-[7/5]" : "aspect-[5/7]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardImageUrl(card.Set, card.Number)}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-snug">{card.Name}</h2>
        {card.Subtitle && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{card.Subtitle}</p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          {card.Set} {card.Number}
        </p>
        <p className="text-xs text-zinc-500">
          {card.Type}, {card.Rarity}
        </p>
      </div>
      <CollectionControls set={card.Set} number={card.Number} initial={owned} />
    </article>
  );
}