type MemoryParentInput = {
  vaultId?: string | null;
  albumId?: string | null;
};

// Routes provide their own parent when clients omit these fields. If a caller
// does supply either parent, validate the resulting association is still exact.
export function hasExactlyOneMemoryParent(
  memory: MemoryParentInput,
  routeVaultId: string | null,
  routeAlbumId: string | null
): boolean {
  const vaultId = memory.vaultId === undefined ? routeVaultId : memory.vaultId;
  const albumId = memory.albumId === undefined ? routeAlbumId : memory.albumId;
  return Boolean(vaultId) !== Boolean(albumId);
}
