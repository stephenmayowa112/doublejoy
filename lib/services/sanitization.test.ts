/**
 * Unit Tests for Input Sanitization Service
 * 
 * Tests XSS prevention for message content, names, and email addresses.
 * Validates Requirements 1.7 and 10.3.
 */

import {
  sanitizeMessage,
  sanitizeName,
  sanitizeEmail,
  containsXSSPatterns,
} from './sanitization';

describe('sanitizeMessage', () => {
  describe('XSS Attack Vector Prevention', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello World');
    });

    it('should remove inline event handlers', () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: protocols', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should remove data: protocols', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">click</a>';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('data:');
      expect(result).not.toContain('script');
    });

    it('should remove vbscript: protocols', () => {
      const input = '<a href="vbscript:msgbox(1)">click</a>';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('vbscript:');
    });

    it('should handle multiple XSS vectors in one input', () => {
      const input = '<script>alert("xss")</script><img src=x onerror="alert(1)">Hello';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Hello';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('Hello');
    });

    it('should remove object tags', () => {
      const input = '<object data="evil.swf"></object>Hello';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('<object');
      expect(result).toContain('Hello');
    });

    it('should remove embed tags', () => {
      const input = '<embed src="evil.swf">Hello';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('<embed');
      expect(result).toContain('Hello');
    });

    it('should handle encoded javascript protocols', () => {
      const input = '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">click</a>';
      const result = sanitizeMessage(input);
      expect(result).not.toContain('alert');
    });
  });

  describe('Safe Content Preservation', () => {
    it('should preserve plain text', () => {
      const input = 'Hello World! This is a normal message.';
      const result = sanitizeMessage(input);
      expect(result).toBe(input);
    });

    it('should preserve allowed formatting tags', () => {
      const input = 'Hello <b>World</b> and <em>everyone</em>!';
      const result = sanitizeMessage(input);
      expect(result).toContain('<b>World</b>');
      expect(result).toContain('<em>everyone</em>');
    });

    it('should preserve line breaks', () => {
      const input = 'Line 1<br>Line 2';
      const result = sanitizeMessage(input);
      expect(result).toContain('<br>');
    });

    it('should preserve paragraph tags', () => {
      const input = '<p>Paragraph 1</p><p>Paragraph 2</p>';
      const result = sanitizeMessage(input);
      expect(result).toContain('<p>Paragraph 1</p>');
      expect(result).toContain('<p>Paragraph 2</p>');
    });

    it('should preserve text content when removing dangerous tags', () => {
      const input = 'Before<script>alert("xss")</script>After';
      const result = sanitizeMessage(input);
      expect(result).toContain('Before');
      expect(result).toContain('After');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = sanitizeMessage('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only string', () => {
      const result = sanitizeMessage('   ');
      expect(result).toBe('');
    });

    it('should handle non-string input', () => {
      const result = sanitizeMessage(null as any);
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = sanitizeMessage(undefined as any);
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeMessage(input);
      expect(result).toBe('Hello World');
    });
  });
});

describe('sanitizeName', () => {
  it('should remove all HTML tags from names', () => {
    const input = 'John<script>alert("xss")</script>Doe';
    const result = sanitizeName(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toBe('JohnDoe');
  });

  it('should remove event handlers from names', () => {
    const input = 'John<img src=x onerror="alert(1)">Doe';
    const result = sanitizeName(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('should remove javascript protocols from names', () => {
    const input = 'John<a href="javascript:alert(1)">Doe</a>';
    const result = sanitizeName(input);
    expect(result).not.toContain('javascript:');
    expect(result).toBe('JohnDoe');
  });

  it('should preserve plain text names', () => {
    const input = 'John Doe';
    const result = sanitizeName(input);
    expect(result).toBe('John Doe');
  });

  it('should handle empty string', () => {
    const result = sanitizeName('');
    expect(result).toBe('');
  });

  it('should handle non-string input', () => {
    const result = sanitizeName(null as any);
    expect(result).toBe('');
  });

  it('should trim whitespace', () => {
    const input = '  John Doe  ';
    const result = sanitizeName(input);
    expect(result).toBe('John Doe');
  });
});

describe('sanitizeEmail', () => {
  it('should remove script tags from email', () => {
    const input = 'test@example.com<script>alert("xss")</script>';
    const result = sanitizeEmail(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toBe('test@example.com');
  });

  it('should remove HTML tags from email', () => {
    const input = 'test@example.com<img src=x onerror="alert(1)">';
    const result = sanitizeEmail(input);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('onerror');
    expect(result).toBe('test@example.com');
  });

  it('should remove javascript protocols from email', () => {
    const input = 'javascript:alert(1)@example.com';
    const result = sanitizeEmail(input);
    expect(result).not.toContain('javascript:');
    expect(result).toBe('alert(1)@example.com');
  });

  it('should preserve valid email addresses', () => {
    const input = 'test@example.com';
    const result = sanitizeEmail(input);
    expect(result).toBe('test@example.com');
  });

  it('should handle empty string', () => {
    const result = sanitizeEmail('');
    expect(result).toBe('');
  });

  it('should handle non-string input', () => {
    const result = sanitizeEmail(null as any);
    expect(result).toBe('');
  });

  it('should trim whitespace', () => {
    const input = '  test@example.com  ';
    const result = sanitizeEmail(input);
    expect(result).toBe('test@example.com');
  });
});

describe('containsXSSPatterns', () => {
  it('should detect script tags', () => {
    expect(containsXSSPatterns('<script>alert("xss")</script>')).toBe(true);
  });

  it('should detect javascript protocols', () => {
    expect(containsXSSPatterns('javascript:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsXSSPatterns('onclick="alert(1)"')).toBe(true);
    expect(containsXSSPatterns('onerror="alert(1)"')).toBe(true);
    expect(containsXSSPatterns('onload="alert(1)"')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(containsXSSPatterns('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should detect object tags', () => {
    expect(containsXSSPatterns('<object data="evil.swf"></object>')).toBe(true);
  });

  it('should detect embed tags', () => {
    expect(containsXSSPatterns('<embed src="evil.swf">')).toBe(true);
  });

  it('should detect data:text/html protocols', () => {
    expect(containsXSSPatterns('data:text/html,<script>alert(1)</script>')).toBe(true);
  });

  it('should detect vbscript protocols', () => {
    expect(containsXSSPatterns('vbscript:msgbox(1)')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(containsXSSPatterns('Hello World')).toBe(false);
    expect(containsXSSPatterns('This is a normal message')).toBe(false);
  });

  it('should handle empty string', () => {
    expect(containsXSSPatterns('')).toBe(false);
  });

  it('should handle non-string input', () => {
    expect(containsXSSPatterns(null as any)).toBe(false);
  });
});
