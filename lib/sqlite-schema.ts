/** Prisma SQLite DDL so Vercel can create tables in /tmp without prisma migrate. */
export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "entityName" TEXT,
    "badge" TEXT NOT NULL DEFAULT 'GREEN',
    "fundedCloses" INTEGER NOT NULL DEFAULT 0,
    "lookingStatus" TEXT NOT NULL DEFAULT 'LOOKING',
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklistNote" TEXT,
    "pofOnFile" BOOLEAN NOT NULL DEFAULT false,
    "entityOnFile" BOOLEAN NOT NULL DEFAULT false,
    "w9OnFile" BOOLEAN NOT NULL DEFAULT false,
    "quietHours" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "BuyBox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "centerLabel" TEXT NOT NULL,
    "zip" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "radiusMiles" REAL NOT NULL,
    "maxAssignmentPrice" INTEGER NOT NULL,
    "minBeds" INTEGER,
    "minSf" INTEGER,
    "workLevels" TEXT NOT NULL,
    "maxRehab" INTEGER,
    "alertMode" TEXT NOT NULL DEFAULT 'A_AND_B',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyBox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "assignmentPrice" INTEGER NOT NULL,
    "originalContractPrice" INTEGER NOT NULL,
    "sellerArv" INTEGER,
    "sellerRepairs" INTEGER,
    "platformAvm" INTEGER,
    "avmSource" TEXT NOT NULL DEFAULT 'mock',
    "beds" INTEGER NOT NULL,
    "baths" REAL NOT NULL,
    "sf" INTEGER NOT NULL,
    "occupancy" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "contractExpiresAt" DATETIME NOT NULL,
    "knownIssues" TEXT NOT NULL,
    "photosJson" TEXT NOT NULL,
    "walkthroughUrl" TEXT,
    "hasWalkthrough" BOOLEAN NOT NULL DEFAULT false,
    "contractUploaded" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "workLevel" TEXT NOT NULL,
    "rehabEstimate" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "offerFloorPct" REAL NOT NULL DEFAULT 10,
    "liveStartedAt" DATETIME NOT NULL,
    "onHoldUntil" DATETIME,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "CompSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "beds" INTEGER NOT NULL,
    "baths" REAL NOT NULL,
    "sf" INTEGER NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "distanceMi" REAL NOT NULL,
    "soldDate" TEXT NOT NULL,
    CONSTRAINT "CompSnapshot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "GradeCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyBoxId" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "isFit" BOOLEAN NOT NULL,
    "barsJson" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GradeCache_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GradeCache_buyBoxId_fkey" FOREIGN KEY ("buyBoxId") REFERENCES "BuyBox" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Hold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hold_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Hold_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "deposit" INTEGER NOT NULL,
    "closeDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pofAttached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Offer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TitleFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "offerId" TEXT,
    "company" TEXT NOT NULL,
    "fileNumber" TEXT NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "routingNumber" TEXT,
    "accountNumber" TEXT,
    "wireReleased" BOOLEAN NOT NULL DEFAULT false,
    "selectedSlotId" TEXT,
    CONSTRAINT "TitleFile_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TitleFile_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "TitleSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "titleFileId" TEXT,
    "startsAt" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TitleSlot_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TitleSlot_titleFileId_fkey" FOREIGN KEY ("titleFileId") REFERENCES "TitleFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Mute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mutedUserId" TEXT NOT NULL,
    CONSTRAINT "Mute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mute_mutedUserId_fkey" FOREIGN KEY ("mutedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Strike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Strike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Blast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "listingId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Blast_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Blast_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "frozen" BOOLEAN NOT NULL DEFAULT false,
    "freezeNote" TEXT,
    CONSTRAINT "Thread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Thread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Thread_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "WorkAgain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "yes" BOOLEAN NOT NULL,
    CONSTRAINT "WorkAgain_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkAgain_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "GradeCache_listingId_buyBoxId_key" ON "GradeCache"("listingId", "buyBoxId");
CREATE UNIQUE INDEX IF NOT EXISTS "TitleFile_listingId_key" ON "TitleFile"("listingId");
CREATE UNIQUE INDEX IF NOT EXISTS "TitleFile_offerId_key" ON "TitleFile"("offerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");
CREATE UNIQUE INDEX IF NOT EXISTS "Mute_userId_mutedUserId_key" ON "Mute"("userId", "mutedUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "Thread_listingId_buyerId_key" ON "Thread"("listingId", "buyerId");
`;
