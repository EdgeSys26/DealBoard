"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { batchListingAction } from "@/lib/actions";
import { SellerListingRow } from "@/components/SellerListingRow";

type Row = {
  listing: Parameters<typeof SellerListingRow>[0]["listing"];
  canHot: boolean;
  isHot: boolean;
};

export function SellerListingsTable({
  rows,
  platformDeposit,
  maxFloor,
  cityHeader,
}: {
  rows: Row[];
  platformDeposit: number;
  maxFloor: number;
  cityHeader: ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const ids = useMemo(() => rows.map((row) => row.listing.id), [rows]);
  const allOn = ids.length > 0 && ids.every((id) => selected.includes(id));

  useEffect(() => {
    setSelected((cur) => cur.filter((id) => ids.includes(id)));
  }, [ids]);

  function toggle(id: string, next: boolean) {
    setSelected((cur) => {
      if (next) return cur.includes(id) ? cur : [...cur, id];
      return cur.filter((item) => item !== id);
    });
  }

  return (
    <div className="card overflow-x-auto">
      {selected.length > 0 ? (
        <form action={batchListingAction} className="batch-bar">
          {selected.map((id) => (
            <input key={id} type="hidden" name="listingId" value={id} />
          ))}
          <span className="text-sm font-semibold">
            {selected.length} selected
          </span>
          <button className="btn-secondary w-auto px-3 py-1.5 text-sm" name="batch" value="hold" type="submit">
            On hold
          </button>
          <button className="btn-secondary w-auto px-3 py-1.5 text-sm" name="batch" value="active" type="submit">
            Active
          </button>
          <button
            className="btn-secondary w-auto px-3 py-1.5 text-sm"
            name="batch"
            value="remove"
            type="submit"
            onClick={(event) => {
              if (!confirm("Remove selected listings from the board?")) event.preventDefault();
            }
          >
            Remove
          </button>
        </form>
      ) : null}
      <table className="board-table listings-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allOn}
                aria-label="Select all listings"
                onChange={(event) => setSelected(event.target.checked ? ids : [])}
              />
            </th>
            <th></th>
            <th>Address</th>
            <th>{cityHeader}</th>
            <th title="Pay homeowner">Contract</th>
            <th>Asking</th>
            <th>Status</th>
            <th>Floor</th>
            <th>Deposit</th>
            <th>Views / Saves</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ listing, canHot, isHot }) => (
            <SellerListingRow
              key={listing.id}
              listing={listing}
              platformDeposit={platformDeposit}
              maxFloor={maxFloor}
              canHot={canHot}
              isHot={isHot}
              checked={selected.includes(listing.id)}
              onChecked={toggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
