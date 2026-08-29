import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNext } from "./safe-next.ts";

test("a path on this site is kept", () => {
  assert.equal(safeNext("/v/blue-note"), "/v/blue-note");
  assert.equal(safeNext("/admin/blue-note?tab=songs"), "/admin/blue-note?tab=songs");
});

test("an absolute URL is refused", () => {
  // Otherwise /login?next=https://example.com/ turns our own sign-in page
  // into a redirect to someone else's.
  assert.equal(safeNext("https://example.com/"), "/admin");
  assert.equal(safeNext("http://example.com/"), "/admin");
  assert.equal(safeNext("javascript:alert(1)"), "/admin");
});

test("a protocol-relative URL is refused", () => {
  assert.equal(safeNext("//evil.example/x"), "/admin");
});

test("a backslash is refused", () => {
  // Some browsers normalise \ to /, which would smuggle //evil past the
  // protocol-relative check.
  assert.equal(safeNext("/\\evil.example"), "/admin");
  assert.equal(safeNext("\\\\evil.example"), "/admin");
});

test("nothing at all falls back", () => {
  assert.equal(safeNext(undefined), "/admin");
  assert.equal(safeNext(""), "/admin");
  assert.equal(safeNext([]), "/admin");
});

test("a repeated query parameter uses the first value", () => {
  // ?next=/a&next=https://evil.example arrives as an array.
  assert.equal(safeNext(["/a", "https://evil.example"]), "/a");
  assert.equal(safeNext(["https://evil.example", "/a"]), "/admin");
});

test("the fallback can be changed", () => {
  assert.equal(safeNext("https://example.com/", "/v/blue-note"), "/v/blue-note");
});
