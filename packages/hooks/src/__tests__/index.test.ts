import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadPolicy, executePreToolGuard, executePostToolDetect, executeStopCheckpoint } from '../index.js';
import type { Policy } from '../../../types/src/index.js';
import { Readable } from 'stream';

vi.mock('fs');
vi.mock('path');

describe('Policy Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadPolicy', () => {
    it('should load valid policy from file', () => {
      const mockPolicy: Policy = {
        actions: {
          deny_domains: ['example.com'],
          ask_patterns: ['*.api'],
          pause_keywords: ['break'],
          snapshot_pdf_domains: ['docs.com']
        }
      };

      vi.mocked(path.join).mockReturnValue('/test/config/policy.json');
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPolicy));

      const result = loadPolicy();

      expect(result).toEqual(mockPolicy);
      expect(path.join).toHaveBeenCalledWith(process.cwd(), 'config', 'policy.json');
      expect(fs.readFileSync).toHaveBeenCalledWith('/test/config/policy.json', 'utf8');
    });

    it('should return default policy when file does not exist', () => {
      vi.mocked(path.join).mockReturnValue('/test/config/policy.json');
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = loadPolicy();

      expect(result).toEqual({
        actions: {
          deny_domains: [],
          ask_patterns: [],
          pause_keywords: [],
          snapshot_pdf_domains: []
        }
      });
    });

    it('should return default policy when JSON is invalid', () => {
      vi.mocked(path.join).mockReturnValue('/test/config/policy.json');
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const result = loadPolicy();

      expect(result).toEqual({
        actions: {
          deny_domains: [],
          ask_patterns: [],
          pause_keywords: [],
          snapshot_pdf_domains: []
        }
      });
    });

    it('should maintain type safety with Policy interface', () => {
      const result = loadPolicy();
      
      // Type assertion tests
      expect(typeof result.actions).toBe('object');
      expect(Array.isArray(result.actions.deny_domains)).toBe(true);
      expect(Array.isArray(result.actions.ask_patterns)).toBe(true);
      expect(Array.isArray(result.actions.pause_keywords)).toBe(true);
      expect(Array.isArray(result.actions.snapshot_pdf_domains)).toBe(true);
    });
  });

  describe('MCP Hook Functions', () => {
    const originalLog = console.log;
    const originalStdin = process.stdin;

    beforeEach(() => {
      console.log = vi.fn();
    });

    afterEach(() => {
      console.log = originalLog;
      process.stdin = originalStdin;
    });

    it('should execute pre-tool guard with valid input', async () => {
      const mockInput = JSON.stringify({ url: 'https://example.com', action: 'fetch' });
      const mockStdin = new Readable({
        read() {
          this.push(mockInput);
          this.push(null);
        }
      });
      
      Object.defineProperty(process, 'stdin', {
        value: mockStdin,
        writable: true
      });

      await executePreToolGuard();
      
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({ permissionDecision: 'allow', reason: 'ok' })
      );
    });

    it('should execute pre-tool guard with denied domain', async () => {
      const mockPolicy: Policy = {
        actions: {
          deny_domains: ['blocked.com'],
          ask_patterns: [],
          pause_keywords: [],
          snapshot_pdf_domains: []
        }
      };

      vi.mocked(path.join).mockReturnValue('/test/config/policy.json');
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPolicy));

      const mockInput = JSON.stringify({ url: 'https://blocked.com/page', action: 'fetch' });
      const mockStdin = new Readable({
        read() {
          this.push(mockInput);
          this.push(null);
        }
      });
      
      Object.defineProperty(process, 'stdin', {
        value: mockStdin,
        writable: true
      });

      await executePreToolGuard();
      
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({ permissionDecision: 'deny', reason: 'blocked domain' })
      );
    });

    it('should execute post-tool detect with pause keyword', async () => {
      const mockPolicy: Policy = {
        actions: {
          deny_domains: [],
          ask_patterns: [],
          pause_keywords: ['login', 'password'],
          snapshot_pdf_domains: []
        }
      };

      vi.mocked(path.join).mockReturnValue('/test/config/policy.json');
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPolicy));

      const mockInput = JSON.stringify({ text: 'Please login to continue', url: 'https://example.com' });
      const mockStdin = new Readable({
        read() {
          this.push(mockInput);
          this.push(null);
        }
      });
      
      Object.defineProperty(process, 'stdin', {
        value: mockStdin,
        writable: true
      });

      await executePostToolDetect();
      
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({ decision: 'pause_for_human', reason: '可能遇到登录/付费墙/验证码' })
      );
    });

    it('should execute stop checkpoint with correct message', async () => {
      await executeStopCheckpoint();
      
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({ message: '到达检查点：请确认计划/证据/取舍后继续（/resume 或给出指示）。' })
      );
    });

    it('should handle invalid JSON input gracefully', async () => {
      const mockInput = 'invalid json';
      const mockStdin = new Readable({
        read() {
          this.push(mockInput);
          this.push(null);
        }
      });
      
      Object.defineProperty(process, 'stdin', {
        value: mockStdin,
        writable: true
      });

      await executePreToolGuard();
      
      expect(console.log).toHaveBeenCalledWith(
        JSON.stringify({ permissionDecision: 'ask', reason: 'bad input' })
      );
    });
  });
});