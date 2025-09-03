// src/markdownConverter.js

export function simpleHtmlToMarkdown(html, domain) {
  console.log("Converting HTML to Markdown using enhanced synchronous simpleHtmlToMarkdown.");

  // 1. Remove contents within script and style tags
  html = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // 2. Replace <br> tags with newline
  html = html.replace(/<br\s*\/?>/gi, "\n");

  // 3. Replace date macros:
  //    Convert <time datetime="2025-04-09" /> to "2025/4/9"
  html = html.replace(/<time[^>]*datetime="([^"]+)"[^>]*\/?>/gi, (match, datetime) => {
    const parts = datetime.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const month = String(parseInt(parts[1], 10));
      const day = String(parseInt(parts[2], 10));
      return year + "/" + month + "/" + day;
    }
    return datetime;
  });

  // 4. Replace user mention macros with a placeholder format.
  //    Extract the account-id attribute and output as @[account-id:xxx]
  html = html.replace(
    /<ac:link>\s*<ri:user[^>]*ri:account-id=["']([^"']+)["'][^>]*\/>\s*<\/ac:link>/gi,
    (match, accountId) => {
      return "@[account-id:" + accountId + "]";
    }
  );

  // 5. Replace various Confluence macros with appropriate Markdown
  
  // 5a. Replace code block macros with language (process first to avoid conflicts)
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']code["'][^>]*>[\s\S]*?<ac:parameter[^>]*ac:name=["']language["'][^>]*>(.*?)<\/ac:parameter>[\s\S]*?<ac:plain-text-body[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/ac:plain-text-body>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, language, code) => {
      return "```" + language.trim() + "\n" + code.trim() + "\n```\n";
    }
  );

  // 5b. Replace code snippet macros with Markdown code blocks (without language)
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']code["'][^>]*>[\s\S]*?<ac:plain-text-body[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/ac:plain-text-body>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, code) => {
      return "```\n" + code.trim() + "\n```\n";
    }
  );

  // 5c. Replace expand macro (collapsible content) - process before generic macros
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']expand["'][^>]*>[\s\S]*?<ac:parameter[^>]*ac:name=["']title["'][^>]*>\s*(.*?)\s*<\/ac:parameter>[\s\S]*?<ac:rich-text-body[^>]*>\s*([\s\S]*?)\s*<\/ac:rich-text-body>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, title, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `<details>\n<summary>${title.trim()}</summary>\n\n${cleanContent}\n\n</details>\n`;
    }
  );

  // 5d. Replace info/note/warning macros
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["'](info|note|warning|tip)["'][^>]*>[\s\S]*?<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, type, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `> **${type.toUpperCase()}**: ${cleanContent}\n`;
    }
  );

  // 5e. Replace table of contents macro
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']toc["'][^>]*>[\s\S]*?<\/ac:structured-macro>/gi,
    '<!-- Table of Contents -->\n'
  );

  // 5f. Replace attachment/image macros
  html = html.replace(
    /<ac:image[^>]*>[\s\S]*?<ri:attachment[^>]*ri:filename=["']([^"']+)["'][^>]*\/>[\s\S]*?<\/ac:image>/gi,
    (match, filename) => {
      return `![${filename}](${filename})\n`;
    }
  );

  // 5g. Replace status macro (status labels)
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']status["'][^>]*>[\s\S]*?<ac:parameter[^>]*ac:name=["']title["'][^>]*>(.*?)<\/ac:parameter>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, status) => {
      return `**Status: ${status.trim()}**\n`;
    }
  );

  // 5h. Replace anchor macro (bookmarks)
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']anchor["'][^>]*>[\s\S]*?<ac:parameter[^>]*ac:name=["'](name|anchor)["'][^>]*>(.*?)<\/ac:parameter>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, paramName, anchorName) => {
      return `<a id="${anchorName.trim()}"></a>\n`;
    }
  );

  // 5i. Replace quote macro
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']quote["'][^>]*>[\s\S]*?<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `> ${cleanContent}\n`;
    }
  );

  // 5j. Replace panel/note macros (different types)
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["'](panel|note)["'][^>]*>[\s\S]*?<ac:rich-text-body[^>]*>([\s\S]*?)<\/ac:rich-text-body>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, type, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      return `> **${type.toUpperCase()}**: ${cleanContent}\n`;
    }
  );

  // 5k. Replace generic structured macros (fallback)
  html = html.replace(
    /<ac:structured-macro[^>]*ac:name=["']([^"']+)["'][^>]*>[\s\S]*?<\/ac:structured-macro>/gi,
    (match, macroName) => {
      return `<!-- Macro: ${macroName} -->\n`;
    }
  );

  // 6. Convert heading tags (<h1> to <h6>) to Markdown headings
  html = html.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n");
  html = html.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n");
  html = html.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n");
  html = html.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n");
  html = html.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n");
  html = html.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n");

  // 7. Convert blockquote tags to Markdown block quotes
  //    If the blockquote contains <p> tags, process each separately.
  html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
    if (paragraphs) {
      const lines = paragraphs.map(p => p.replace(/<p[^>]*>(.*?)<\/p>/i, "$1").trim());
      return lines.map(line => "> " + line).join("\n") + "\n";
    } else {
      let text = content.replace(/<[^>]+>/g, '').trim();
      return text.split('\n').map(line => "> " + line.trim()).join("\n") + "\n";
    }
  });

  // 8. Convert unordered list (<ul>) items to Markdown list
  html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    return listContent.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, liContent) => {
      return "- " + liContent.trim() + "\n";
    });
  });

  // 9. Convert ordered list (<ol>) items to Markdown numbered list
  html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    let counter = 1;
    return listContent.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, liContent) => {
      return counter++ + ". " + liContent.trim() + "\n";
    });
  });

  // 10. Convert table tags to Markdown table format
  html = html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
    // First, extract all rows
    let rows = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (!rows) return '';
    
    let mdRows = [];
    let hasHeaderRow = false;
    
    rows.forEach((row, index) => {
      // Check if this row contains header cells <th>
      let headerCells = row.match(/<th[^>]*>([\s\S]*?)<\/th>/gi);
      let dataCells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
      
      if (headerCells) {
        // Process header row
        let headers = headerCells.map(cell => {
          // Remove HTML tags but preserve inner text
          return cell.replace(/<th[^>]*>([\s\S]*?)<\/th>/i, '$1').replace(/<[^>]+>/g, '').trim();
        });
        mdRows.push("| " + headers.join(" | ") + " |");
        
        // Add separator row
        let separator = headers.map(() => "---");
        mdRows.push("| " + separator.join(" | ") + " |");
        hasHeaderRow = true;
      } else if (dataCells) {
        // Process data row
        let cellTexts = dataCells.map(cell => {
          // Remove HTML tags but preserve inner text
          return cell.replace(/<td[^>]*>([\s\S]*?)<\/td>/i, '$1').replace(/<[^>]+>/g, '').trim();
        });
        
        // If this is the first row and no header was found, treat it as header
        if (index === 0 && !hasHeaderRow) {
          mdRows.push("| " + cellTexts.join(" | ") + " |");
          let separator = cellTexts.map(() => "---");
          mdRows.push("| " + separator.join(" | ") + " |");
          hasHeaderRow = true;
        } else {
          mdRows.push("| " + cellTexts.join(" | ") + " |");
        }
      }
    });
    
    return mdRows.join("\n") + "\n";
  });

  // 11. Convert paragraph tags (<p>) to newline (if not already processed)
  html = html.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");

  // 12. Remove any remaining HTML tags (but preserve details/summary for expand macros)
  html = html.replace(/<(?!\/?(?:details|summary)\b)[^>]+>/g, '');

  // 13. Replace HTML entities using an extended mapping
  const htmlEntityMap = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": "\"",
    "&#39;": "'",
    "&larr;": "←",
    "&rarr;": "→",
    "&uarr;": "↑",
    "&darr;": "↓"
    // Add more entities if needed.
  };
  function decodeHtmlEntities(str) {
    return str.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return htmlEntityMap[entity] || entity;
    });
  }
  html = decodeHtmlEntities(html);

  return html.trim();
}
