(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.versioning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CURRENT_SCHEMA_VERSION = "1.0";

  function parseVersion(value) {
    const match = /^([0-9]+)\.([0-9]+)$/.exec(String(value || ""));
    if (!match) return null;
    return { major: Number(match[1]), minor: Number(match[2]) };
  }

  function isValidVersion(value) {
    return !!parseVersion(value);
  }

  function compareVersions(a, b) {
    const left = parseVersion(a);
    const right = parseVersion(b);
    if (!left || !right) throw new Error("Versions must use MAJOR.MINOR format.");
    if (left.major !== right.major) return left.major - right.major;
    return left.minor - right.minor;
  }

  function createVersion(contentVersion, generatorVersion) {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      contentVersion: contentVersion || CURRENT_SCHEMA_VERSION,
      generatorVersion: generatorVersion || null,
    };
  }

  return Object.freeze({ CURRENT_SCHEMA_VERSION, parseVersion, isValidVersion, compareVersions, createVersion });
});
