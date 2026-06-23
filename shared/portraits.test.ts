import { describe, it, expect } from "vitest";
import { ROLE_PORTRAITS, ROLES } from "@shared/types";

describe("Character Portraits", () => {
  it("should have portraits for all roles", () => {
    ROLES.forEach((role) => {
      expect(ROLE_PORTRAITS[role]).toBeDefined();
      expect(typeof ROLE_PORTRAITS[role]).toBe("string");
      expect(ROLE_PORTRAITS[role].length).toBeGreaterThan(0);
    });
  });

  it("should have exactly 10 portraits", () => {
    const portraitCount = Object.keys(ROLE_PORTRAITS).length;
    expect(portraitCount).toBe(10);
  });

  it("should have valid storage paths for all portraits", () => {
    ROLES.forEach((role) => {
      const portraitUrl = ROLE_PORTRAITS[role];
      expect(portraitUrl).toMatch(/^\/assets\//);
      expect(portraitUrl).toMatch(/\.png$/);
    });
  });

  it("should have unique portrait URLs", () => {
    const urls = Object.values(ROLE_PORTRAITS);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  it("should map all roles to their correct portraits", () => {
    const expectedMappings: Record<string, string> = {
      "Homecoming Queen": "/assets/homecoming_queen.png",
      Bully: "/assets/bully.png",
      "Gossip Queen": "/assets/gossip_queen.png",
      Mathlete: "/assets/mathlete.png",
      Teacher: "/assets/teacher.png",
      "Dumb Cheerleader": "/assets/dumb_cheerleader.png",
      "Dumb Jock": "/assets/dumb_jock.png",
      Principal: "/assets/principal.png",
      "School Counselor": "/assets/school_counselor.png",
      Vampire: "/assets/vampire.png",
    };

    Object.entries(expectedMappings).forEach(([role, expectedUrl]) => {
      expect(ROLE_PORTRAITS[role as keyof typeof ROLE_PORTRAITS]).toBe(
        expectedUrl
      );
    });
  });
});
