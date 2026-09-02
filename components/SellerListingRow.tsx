"use client";

import Link from "next/link";
import { useState } from "react";
import { ClickRow } from "@/components/ClickRow";
import { saveListingRowAction, setListingStatusAction, startHotAction } from "@/lib/actions";
import { listingPhotos } from "@/lib/listing-photos";
import { ListingPhoto } from "@/components/ListingPhoto";
import { listingDaysCopy, listingExpiresSoon } from "@/lib/seller-board";
import { compactUsd, usd } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/types";

type RowListing = {
  id: string;
  address: string;
  city: string;
  photosJson: string;
  assignmentPrice: number;
  originalContractPrice: number;
  status: string;
  offerFloorPct: number;
  titleDeposit: number | null;
  views: number;
  verified: boolean;
  contractExpiresAt: Date | string;
  hotUntil?: Date | string | null;
  holds: { id: string }[];
  offers: { status: string; counterPrice: number | null; price: number }[];
  favorites: { id: string }[];
};

function spreadLabel(n: number) {
  if (n === 0) return null;
  const abs = compactUsd(Math.abs(n));
  return n > 0 ? `+${abs}` : `−${abs}`;
}

export function SellerListingRow({
  listing,
  platformDeposit,
  maxFloor,
  canHot,
  isHot,
  checked,
  onChecked,
}: {
  listing: RowListing;
  platformDeposit: number;
  maxFloor: number;
  canHot: boolean;
  isHot: boolean;
  checked: boolean;
  onChecked: (id: string, next: boolean) => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [asking, setAsking] = useState(listing.assignmentPrice);
  const photos = listingPhotos(listing);
  const deposit = Math.max(listing.titleDeposit ?? platformDeposit, platformDeposit);
  const expiresAt = new Date(listing.contractExpiresAt);
  const daysCopy = listingDaysCopy(expiresAt, listing.status);
  const expiresSoon = listingExpiresSoon({
    status: listing.status,
    contractExpiresAt: expiresAt,
  });
  const spread = spreadLabel(asking - listing.originalContractPrice);
  const counter = listing.offers.find((offer) => offer.status === "COUNTERED");
  const formId = `listing-save-${listing.id}`;
  const viewHref = `/listings/${listing.id}`;

  async function saveRow(formData: FormData) {
    await saveListingRowAction(listing.id, formData);
    setDirty(false);
  }

  return (
    <ClickRow href={viewHref}>
      <td>
        <input
          type="checkbox"
          checked={checked}
          aria-label={`Select ${listing.address}`}
          onChange={(event) => onChecked(listing.id, event.target.checked)}
        />
      </td>
      <td>
        <Link href={viewHref}>
          <ListingPhoto src={photos[0]} className="listing-thumb" />
        </Link>
      </td>
      <td>
        <Link href={viewHref} className="font-semibold">
          {isHot ? <span className="hot-flame" aria-label="Hot">🔥</span> : null}
          {listing.address}
        </Link>
        <p className={`listing-days${expiresSoon ? " soon" : ""}`}>{daysCopy}</p>
      </td>
      <td className="whitespace-nowrap">{listing.city}</td>
      <td className="whitespace-nowrap">{usd(listing.originalContractPrice)}</td>
      <td>
        <input
          form={formId}
          name="assignmentPrice"
          type="number"
          min={1}
          step={100}
          defaultValue={listing.assignmentPrice}
          aria-label="Asking"
          onChange={(event) => {
            setAsking(Number(event.target.value) || listing.assignmentPrice);
            setDirty(true);
          }}
        />
        {spread ? <p className="listing-spread">{spread}</p> : null}
      </td>
      <td>
        <div className="listing-status">
          <div className="flex flex-wrap gap-1">
            {listing.verified ? (
              (["ACTIVE", "ON_HOLD", "UNDER_CONTRACT"] as const).map((status) => (
                <form key={status} action={setListingStatusAction.bind(null, listing.id, status)}>
                  <button
                    className="chip justify-center"
                    data-on={listing.status === status ? "true" : "false"}
                    type="submit"
                  >
                    {STATUS_LABEL[status]}
                  </button>
                </form>
              ))
            ) : (
              <>
                <span className="chip justify-center" data-on="true">
                  Draft
                </span>
                {listing.status !== "DRAFT" ? (
                  <form action={setListingStatusAction.bind(null, listing.id, "DRAFT")}>
                    <button className="chip justify-center" type="submit">
                      Move to draft
                    </button>
                  </form>
                ) : null}
              </>
            )}
          </div>
          {!listing.verified ? <p className="listing-days">Needs contract verified</p> : null}
          {counter ? (
            <p className="offer-status-pill counter listing-counter-chip">
              Counter sent · {usd(counter.counterPrice ?? counter.price)}
            </p>
          ) : null}
          {isHot ? <p className="listing-days">Hot</p> : null}
          {canHot ? (
            <div className="flex flex-wrap gap-1">
              <form action={startHotAction}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="hours" value="48" />
                <button className="chip justify-center" type="submit">
                  Hot $99 / 48h
                </button>
              </form>
              <form action={startHotAction}>
                <input type="hidden" name="listingId" value={listing.id} />
                <input type="hidden" name="hours" value="72" />
                <button className="chip justify-center" type="submit">
                  Hot $179 / 72h
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </td>
      <td>
        <label className="listing-inline">
          <input
            form={formId}
            name="offerFloorPct"
            type="number"
            min={0}
            max={maxFloor}
            step={1}
            defaultValue={listing.offerFloorPct}
            aria-label="Offer floor percent under"
            onChange={() => setDirty(true)}
          />
          <span>%</span>
        </label>
      </td>
      <td>
        <input
          form={formId}
          name="titleDeposit"
          type="number"
          min={platformDeposit}
          step={100}
          defaultValue={deposit}
          aria-label="Title deposit"
          onChange={() => setDirty(true)}
        />
      </td>
      <td className="whitespace-nowrap text-sm text-muted">
        {listing.views} / {listing.favorites.length}
      </td>
      <td>
        <form id={formId} action={saveRow}>
          <button className="listing-save" type="submit" disabled={!dirty}>
            Save
          </button>
        </form>
      </td>
    </ClickRow>
  );
}
