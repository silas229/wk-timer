import { describe, it, expect, afterEach } from "vitest";
import { getBaseUrl } from "@/lib/base-url";

describe("getBaseUrl", () => {
  const originalEnv = process.env.BASE_URL;

  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.BASE_URL = originalEnv;
    } else {
      delete process.env.BASE_URL;
    }
  });

  it("should return BASE_URL when set to a valid URL", () => {
    process.env.BASE_URL = "https://example.com";
    expect(getBaseUrl()).toBe("https://example.com");
  });

  it("should return BASE_URL when set with trailing whitespace", () => {
    process.env.BASE_URL = "  https://example.com  ";
    expect(getBaseUrl()).toBe("https://example.com");
  });

  it("should return localhost when BASE_URL is undefined", () => {
    delete process.env.BASE_URL;
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("should return localhost when BASE_URL is empty string", () => {
    process.env.BASE_URL = "";
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("should return localhost when BASE_URL is only whitespace", () => {
    process.env.BASE_URL = "   ";
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("should return localhost when BASE_URL is just a slash", () => {
    process.env.BASE_URL = "/";
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("should use fallback URL when BASE_URL is not set", () => {
    delete process.env.BASE_URL;
    expect(getBaseUrl("https://custom.example.com")).toBe(
      "https://custom.example.com"
    );
  });

  it("should prioritize BASE_URL over fallback", () => {
    process.env.BASE_URL = "https://production.example.com";
    expect(getBaseUrl("https://fallback.example.com")).toBe(
      "https://production.example.com"
    );
  });
});
