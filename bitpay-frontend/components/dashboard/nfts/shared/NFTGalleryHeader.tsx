"use client";

export function NFTGalleryHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">NFT Gallery</h1>
        <p className="text-muted-foreground">
          Manage your stream NFTs - receipts and payment obligations
        </p>
      </div>
    </div>
  );
}
