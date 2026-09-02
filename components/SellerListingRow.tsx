"use client";

import Link from "next/link";
import { useState } from "react";
import { ClickRow } from "@/components/ClickRow";
import { saveListingRowAction, setListingStatusAction } from "@/lib/actions";
import { listingPhotos } from "@/lib/listing-photos";
import { listingDaysLeft, listingExpiresSoon } from "@/lib/seller-board";
import { compactUsd, usd } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/types";

type RowListing = {
  id: string;
  address: string;
  photosJson: string;
  assignmentPrice: number;
  originalContractPrice: number;
  status: string;
  offerFloorPct: number;
  titleDeposit: number | null;
  views: number;
  verified: boolean;
  contractExpiresAt: Date | string;
  holds: { id: string }[];
  offers: { status: string; counterPrice: number | null; price: number }[];
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
}: {
  listing: RowListing;
  platformDeposit: number;
  maxFloor: number;
}) {
  const [dirty, setDirty] = useState(false);
  const photos = listingPhotos(listing);
  const deposit = Math.max(listing.titleDeposit ?? platformDeposit, platformDeposit);
  const days = listingDaysLeft(new Date(listing.contractExpiresAt));
  const expiresSoon = listingExpiresSoon({
    status: listing.status,
    contractExpiresAt: new Date(listing.contractExpiresAt),
  });
  const spread = spreadLabel(listing.assignmentPrice - listing.originalContractPrice);
  const counter = listing.offers.find((offer) => offer.status === "COUNTERED");
  const formId = `listing-save-${listing.id}`;

  return (
    <ClickRow href={`/listings/${listing.id}`}>
      <td>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="" className="listing-thumb" />
      </td>
      <td>
        <Link href={`/listings/${listing.id}`} className="font-semibold">
          {listing.address}
          {expiresSoon ? (
            <span className="tab-dot red" title="Contract expires in 3 days or less" />
          ) : null}
        </Link>
        <p className="listing-days">
          {days === 1 ? "1 day" : `${days} days`}
        </p>
      </td>
      <td className="whitespace-nowrap">{usd(listing.originalContractPrice)}</td>
      <td className="whitespace-nowrap">
        {usd(listing.assignmentPrice)}
        {spread ? <p className="listing-spread">{spread}</p> : null}
      </td>
      <td>
        <div className="listing-status">
          <div className="flex flex-wrap gap-1">
            {(["ACTIVE", "ON_HOLD", "UNDER_CONTRACT"] as const).map((status) => (
              <form key={status} action={setListingStatusAction.bind(null, listing.id, status)}>
                <button
                  className="chip justify-center"
                  data-on={listing.status === status ? "true" : "false"}
                  type="submit"
                >
                  {STATUS_LABEL[status]}
                </button>
              </form>
            ))}
          </div>
          {counter ? (
            <p className="offer-status-pill counter listing-counter-chip">
              Counter sent · {usd(counter.counterPrice ?? counter.price)}
            </p>
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
        {listing.views}/{listing.holds.length}/{listing.offers.length}
      </td>
      <td className="whitespace-nowrap text-sm">{listing.verified ? "Yes" : "—"}</td>
      <td>
        <form id={formId} action={saveListingRowAction.bind(null, listing.id)}>
          <button className="listing-save" type="submit" disabled={!dirty}>
            Save
          </button>
        </form>
      </td>
    </ClickRow>
  );
}
