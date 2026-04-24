import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mockMaybeSingle }),
      }),
    }),
  }),
}));

import { getEcosystemOrgForCurrentUser } from "../owner";

beforeEach(() => {
  mockGetUser.mockReset();
  mockMaybeSingle.mockReset();
});

describe("getEcosystemOrgForCurrentUser", () => {
  it("returns null when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await getEcosystemOrgForCurrentUser();
    expect(result).toBeNull();
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it("returns null when the user is not owner of any ecosystem org", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockMaybeSingle.mockResolvedValue({ data: null });
    const result = await getEcosystemOrgForCurrentUser();
    expect(result).toBeNull();
  });

  it("returns the mapped context when the user owns an org", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { id: "org-1", name: "Test Park", org_type: "science_park" },
    });
    const result = await getEcosystemOrgForCurrentUser();
    expect(result).toEqual({
      orgId: "org-1",
      orgName: "Test Park",
      orgType: "science_park",
    });
  });
});
