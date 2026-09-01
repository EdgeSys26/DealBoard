import { favoriteAction } from "@/lib/deal-actions";

export function SaveStar({ listingId, saved }: { listingId: string; saved: boolean }) {
  return (
    <form action={favoriteAction.bind(null, listingId, "FAVORITE")}>
      <button
        type="submit"
        className="star-btn"
        data-on={saved ? "true" : "false"}
        aria-label={saved ? "Unsave listing" : "Save listing"}
        title={saved ? "Saved" : "Save"}
      >
        {saved ? "★" : "☆"}
      </button>
    </form>
  );
}
