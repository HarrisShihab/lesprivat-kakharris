(function (root, factory) {
  "use strict";
  const api = factory(
    root.KakHarrisMathLab && root.KakHarrisMathLab.contracts
      ? root.KakHarrisMathLab.contracts.mathRenderer
      : null,
    root.KakHarrisMathLab && root.KakHarrisMathLab.mathRenderer
      ? root.KakHarrisMathLab.mathRenderer.katexLoader
      : null
  );
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.mathRenderer = root.KakHarrisMathLab.mathRenderer || {};
  root.KakHarrisMathLab.mathRenderer.MathRenderer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (contract, katexLoader) {
  "use strict";

  const CONTRACT_VERSION = contract ? contract.CONTRACT_VERSION : "1.0";
  const SOURCE_FORMAT = "latex";
  const MAX_SOURCE_LENGTH = 2000;
  const MAX_NESTING_DEPTH = 32;

  // MVP allow-list: enough for the pilot without exposing arbitrary TeX features.
  const ALLOWED_COMMANDS = new Set([
    "frac",
    "sqrt",
    "left",
    "right",
    "cdot",
    "times",
    "div",
    "pm",
    "mp",
    "le",
    "leq",
    "ge",
    "geq",
    "neq",
    "approx",
    "infty",
    "quad",
    ";",
    ",",
    ":",
    "!",
    "\\",
    "begin",
    "end",
  ]);

  const ALLOWED_ENVIRONMENTS = new Set(["aligned"]);

  const BLOCKED_TOKENS = [
    "\\html",
    "\\href",
    "\\url",
    "\\includegraphics",
    "\\class",
    "\\style",
    "\\color",
    "\\definecolor",
    "\\def",
    "\\gdef",
    "\\edef",
    "\\xdef",
    "\\newcommand",
    "\\renewcommand",
    "\\providecommand",
    "\\input",
    "\\include",
    "\\message",
    "\\errmessage",
    "\\write",
  ];

  const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

  function normalizeSource(source) {
    if (typeof source !== "string") {
      throw new TypeError("Math source must be a string.");
    }
    return source.trim();
  }

  function getCommandNames(source) {
    const names = [];
    const regex = /\\([A-Za-z]+|[^A-Za-z\s])/g;
    let match;
    while ((match = regex.exec(source))) names.push(match[1]);
    return names;
  }

  function validateEnvironmentSyntax(source) {
    const stack = [];
    const regex = /\\(begin|end)\{([^{}]+)\}/g;
    let match;
    while ((match = regex.exec(source))) {
      const operation = match[1];
      const environment = match[2];
      if (!ALLOWED_ENVIRONMENTS.has(environment)) {
        return { valid: false, reason: `Unsupported environment: ${environment}` };
      }
      if (operation === "begin") {
        stack.push(environment);
        if (stack.length > MAX_NESTING_DEPTH) {
          return { valid: false, reason: "Math environment nesting is too deep." };
        }
      } else {
        if (stack.pop() !== environment) {
          return { valid: false, reason: "Unbalanced math environment." };
        }
      }
    }
    return stack.length === 0
      ? { valid: true, reason: null }
      : { valid: false, reason: "Unclosed math environment." };
  }

  function validateSource(source) {
    let value;
    try {
      value = normalizeSource(source);
    } catch (error) {
      return { valid: false, reason: error.message, source: "" };
    }

    if (!value) return { valid: false, reason: "Math source is empty.", source: value };
    if (value.length > MAX_SOURCE_LENGTH) {
      return { valid: false, reason: `Math source exceeds ${MAX_SOURCE_LENGTH} characters.`, source: value };
    }
    if (UNSAFE_CHARS.test(value)) {
      return { valid: false, reason: "Math source contains disallowed control characters.", source: value };
    }
    if (/[<>]/.test(value)) {
      return { valid: false, reason: "HTML-like characters are not allowed in math source.", source: value };
    }
    if (BLOCKED_TOKENS.some((token) => value.includes(token))) {
      return { valid: false, reason: "Math source contains a blocked TeX command.", source: value };
    }

    const commands = getCommandNames(value);
    for (const command of commands) {
      if (!ALLOWED_COMMANDS.has(command)) {
        return { valid: false, reason: `Unsupported TeX command: \\${command}`, source: value };
      }
    }

    const environmentResult = validateEnvironmentSyntax(value);
    if (!environmentResult.valid) {
      return { valid: false, reason: environmentResult.reason, source: value };
    }

    const braceBalance = [...value].reduce((balance, char) => {
      if (char === "{") return balance + 1;
      if (char === "}") return balance - 1;
      return balance;
    }, 0);
    if (braceBalance !== 0) {
      return { valid: false, reason: "Math source contains unbalanced braces.", source: value };
    }

    return { valid: true, reason: null, source: value };
  }

  function safeFallbackText(source, fallbackText) {
    const fallback = fallbackText == null ? source : String(fallbackText);
    return fallback.length > 500 ? `${fallback.slice(0, 497)}...` : fallback;
  }

  function createRenderer(options) {
    const value = options || {};
    const injectedKatex = value.katex || null;
    const loader = value.katexLoader || katexLoader || null;
    const globalObject = value.globalObject || (typeof globalThis !== "undefined" ? globalThis : null);
    const documentObject = value.documentObject || (typeof document !== "undefined" ? document : null);

    function resolveKatex() {
      if (injectedKatex) return Promise.resolve(injectedKatex);
      if (loader && typeof loader.load === "function") {
        return loader.load({ globalObject, documentObject });
      }
      if (globalObject && globalObject.katex) return Promise.resolve(globalObject.katex);
      return Promise.reject(new Error("KaTeX is not available."));
    }

    function render(source, options) {
      const request = options || {};
      const validation = validateSource(source);
      const fallbackText = safeFallbackText(source, request.fallbackText);

      if (!validation.valid) {
        return Promise.resolve({
          ok: false,
          html: null,
          text: fallbackText,
          source: validation.source,
          error: validation.reason,
          fallback: true,
        });
      }

      return resolveKatex()
        .then((katex) => {
          if (!katex || typeof katex.renderToString !== "function") {
            throw new Error("Configured KaTeX implementation is invalid.");
          }

          const html = katex.renderToString(validation.source, {
            displayMode: request.displayMode !== false,
            throwOnError: true,
            trust: false,
            strict: "warn",
            maxExpand: 1000,
            output: request.output || "htmlAndMathml",
          });

          return {
            ok: true,
            html,
            text: fallbackText,
            source: validation.source,
            error: null,
            fallback: false,
          };
        })
        .catch((error) => ({
          ok: false,
          html: null,
          text: fallbackText,
          source: validation.source,
          error: error && error.message ? error.message : "Math rendering failed.",
          fallback: true,
        }));
    }

    async function renderToElement(element, source, options) {
      if (!element || typeof element !== "object") {
        throw new TypeError("A valid target element is required.");
      }

      const result = await render(source, options);
      if (result.ok) {
        element.innerHTML = result.html;
      } else {
        element.textContent = result.text;
      }
      return result;
    }

    function renderSync(source, options) {
      const request = options || {};
      const validation = validateSource(source);
      const fallbackText = safeFallbackText(source, request.fallbackText);
      if (!validation.valid) {
        return {
          ok: false,
          html: null,
          text: fallbackText,
          source: validation.source,
          error: validation.reason,
          fallback: true,
        };
      }

      let katex = injectedKatex;
      if (!katex && globalObject) katex = globalObject.katex;
      if (!katex || typeof katex.renderToString !== "function") {
        return {
          ok: false,
          html: null,
          text: fallbackText,
          source: validation.source,
          error: "KaTeX is not available synchronously.",
          fallback: true,
        };
      }

      try {
        const html = katex.renderToString(validation.source, {
          displayMode: request.displayMode !== false,
          throwOnError: true,
          trust: false,
          strict: "warn",
          maxExpand: 1000,
          output: request.output || "htmlAndMathml",
        });
        return { ok: true, html, text: fallbackText, source: validation.source, error: null, fallback: false };
      } catch (error) {
        return {
          ok: false,
          html: null,
          text: fallbackText,
          source: validation.source,
          error: error && error.message ? error.message : "Math rendering failed.",
          fallback: true,
        };
      }
    }

    return Object.freeze({
      CONTRACT_VERSION,
      SOURCE_FORMAT,
      MAX_SOURCE_LENGTH,
      SUPPORTED_COMMANDS: Object.freeze([...ALLOWED_COMMANDS]),
      validateSource,
      render,
      renderSync,
      renderToElement,
    });
  }

  return Object.freeze({
    CONTRACT_VERSION,
    SOURCE_FORMAT,
    MAX_SOURCE_LENGTH,
    SUPPORTED_COMMANDS: Object.freeze([...ALLOWED_COMMANDS]),
    validateSource,
    createRenderer,
  });
});
