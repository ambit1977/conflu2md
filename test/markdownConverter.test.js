// test/markdownConverter.test.js

import { jest } from '@jest/globals';
import { simpleHtmlToMarkdown } from '../src/markdownConverter.js';

describe('simpleHtmlToMarkdown', () => {
  test('should convert tables with headers correctly', () => {
    const html = `
      <table>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
        <tr>
          <td>Data 1</td>
          <td>Data 2</td>
        </tr>
        <tr>
          <td>Data 3</td>
          <td>Data 4</td>
        </tr>
      </table>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    const expected = `| Header 1 | Header 2 |
| --- | --- |
| Data 1 | Data 2 |
| Data 3 | Data 4 |`;
    
    expect(result.trim()).toBe(expected);
  });

  test('should convert tables without headers correctly', () => {
    const html = `
      <table>
        <tr>
          <td>Cell 1</td>
          <td>Cell 2</td>
        </tr>
        <tr>
          <td>Cell 3</td>
          <td>Cell 4</td>
        </tr>
      </table>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    const expected = `| Cell 1 | Cell 2 |
| --- | --- |
| Cell 3 | Cell 4 |`;
    
    expect(result.trim()).toBe(expected);
  });

  test('should convert code macros correctly', () => {
    const html = `
      <ac:structured-macro ac:name="code">
        <ac:plain-text-body><![CDATA[
console.log("Hello World");
        ]]></ac:plain-text-body>
      </ac:structured-macro>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    expect(result).toContain('```\nconsole.log("Hello World");\n```');
  });

  test('should convert code macros with language correctly', () => {
    const html = `
      <ac:structured-macro ac:name="code">
        <ac:parameter ac:name="language">javascript</ac:parameter>
        <ac:plain-text-body><![CDATA[
const x = 1;
        ]]></ac:plain-text-body>
      </ac:structured-macro>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    expect(result).toContain('```javascript\nconst x = 1;\n```');
  });

  test('should convert info macros correctly', () => {
    const html = `
      <ac:structured-macro ac:name="info">
        <ac:rich-text-body>
          <p>This is important information</p>
        </ac:rich-text-body>
      </ac:structured-macro>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    expect(result).toContain('> **INFO**: This is important information');
  });

  test('should convert expand macros correctly', () => {
    const html = `
      <ac:structured-macro ac:name="expand">
        <ac:parameter ac:name="title">Click to expand</ac:parameter>
        <ac:rich-text-body>
          <p>Hidden content here</p>
        </ac:rich-text-body>
      </ac:structured-macro>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    expect(result).toContain('<details>');
    expect(result).toContain('<summary>Click to expand</summary>');
    expect(result).toContain('Hidden content here');
    expect(result).toContain('</details>');
  });

  test('should convert status macros correctly', () => {
    const html = `
      <ac:structured-macro ac:name="status">
        <ac:parameter ac:name="title">In Progress</ac:parameter>
      </ac:structured-macro>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    expect(result).toContain('**Status: In Progress**');
  });

  test('should handle nested HTML in table cells', () => {
    const html = `
      <table>
        <tr>
          <th>Header</th>
        </tr>
        <tr>
          <td><strong>Bold text</strong> and <em>italic text</em></td>
        </tr>
      </table>
    `;
    
    const result = simpleHtmlToMarkdown(html, 'example.atlassian.net');
    expect(result).toContain('| Header |');
    expect(result).toContain('| Bold text and italic text |');
  });
});
