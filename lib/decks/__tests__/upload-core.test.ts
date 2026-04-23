import { describe, it, expect } from "vitest";
import { MAX_FILE_SIZE, DECK_UPLOAD_LIMIT_PER_BATCH } from "../upload-core";
import { DECK_UPLOAD_LIMIT_PER_BATCH as LIMIT_FROM_BATCHES } from "@/lib/batches";

describe("upload-core constants", () => {
  it("MAX_FILE_SIZE is 20 MB", () => {
    expect(MAX_FILE_SIZE).toBe(20 * 1024 * 1024);
  });

  it("DECK_UPLOAD_LIMIT_PER_BATCH re-exports the value from lib/batches", () => {
    expect(DECK_UPLOAD_LIMIT_PER_BATCH).toBe(LIMIT_FROM_BATCHES);
    expect(DECK_UPLOAD_LIMIT_PER_BATCH).toBe(2);
  });
});
