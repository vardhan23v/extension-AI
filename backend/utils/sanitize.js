const sanitizeFiles = (files) => {
  const sanitized = files.map((file) => {
    let content = file.content;

    if (typeof content !== 'string') {
      content = JSON.stringify(content, null, 2);
    }

    // Block eval() — always dangerous
    if (/eval\s*\(/.test(content)) {
      throw new Error(`Security violation in ${file.filename}: eval() is not allowed`);
    }

    // Block dangerous URI schemes in fetch calls
    const fetchMatches = content.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi) || [];
    for (const match of fetchMatches) {
      const urlMatch = match.match(/['"`]([^'"`]+)['"`]/);
      if (urlMatch) {
        const url = urlMatch[1];
        if (url.startsWith('javascript:') || url.startsWith('data:')) {
          throw new Error(`Security violation in ${file.filename}: fetch to dangerous scheme "${url}"`);
        }
      }
    }

    // Block suspicious obfuscation in very large files
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
