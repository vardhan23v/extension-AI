const dangerousPatterns = [
  /eval\s*\(/gi,
  /document\.cookie/gi,
  /XMLHttpRequest/gi,
  /fetch\s*\(/gi,
];

const whitelistedDomains = [
  'chrome.google.com',
  'github.com',
  'api.github.com',
];

const sanitizeFiles = (files) => {
  const sanitized = files.map((file) => {
    let content = file.content;

    // Check for eval()
    if (/eval\s*\(/.test(content)) {
      throw new Error(`Security violation in ${file.filename}: eval() is not allowed`);
    }

    // Check for document.cookie access
    if (/document\.cookie/.test(content)) {
      throw new Error(`Security violation in ${file.filename}: Direct document.cookie access is not allowed`);
    }

    // Check for unwhitelisted fetch/XMLHttpRequest
    const fetchMatches = content.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi) || [];
    for (const match of fetchMatches) {
      const urlMatch = match.match(/['"`]([^'"`]+)['"`]/);
      if (urlMatch) {
        const url = urlMatch[1];
        const isWhitelisted = whitelistedDomains.some((domain) => url.includes(domain));
        if (!isWhitelisted && !url.startsWith('/') && !url.startsWith('chrome://')) {
          throw new Error(`Security violation in ${file.filename}: fetch to non-whitelisted domain "${url}"`);
        }
      }
    }

    // Check for suspicious obfuscation patterns
    if (/[\\u][0-9a-fA-F]{4}/.test(content) && content.length > 10000) {
      throw new Error(`Security violation in ${file.filename}: Possible obfuscated code detected`);
    }

    return {
      filename: file.filename,
      content: content,
    };
  });

  return sanitized;
};

module.exports = { sanitizeFiles };
