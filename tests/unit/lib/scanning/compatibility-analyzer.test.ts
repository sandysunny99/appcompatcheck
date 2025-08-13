import { CompatibilityAnalyzer } from '@/lib/scanning/compatibility-analyzer'
import { CompatibilityRule, ScanResult, FileContent } from '@/types/scanning'

describe('CompatibilityAnalyzer', () => {
  let analyzer: CompatibilityAnalyzer
  
  const mockRules: CompatibilityRule[] = [
    {
      id: 'deprecated-api',
      name: 'Deprecated API Usage',
      description: 'Detects usage of deprecated APIs',
      category: 'compatibility',
      severity: 'high',
      pattern: /deprecated_function/g,
      message: 'Use of deprecated function detected',
    },
    {
      id: 'security-issue',
      name: 'Security Vulnerability',
      description: 'Detects potential security issues',
      category: 'security',
      severity: 'critical',
      pattern: /eval\(/g,
      message: 'Use of eval() detected - potential security risk',
    },
  ]

  beforeEach(() => {
    analyzer = new CompatibilityAnalyzer(mockRules)
  })

  describe('analyzeFile', () => {
    it('should detect compatibility issues in code', async () => {
      const fileContent: FileContent = {
        path: 'test.js',
        content: 'function test() { deprecated_function(); }',
        type: 'javascript',
      }

      const result = await analyzer.analyzeFile(fileContent)

      expect(result.issues).toHaveLength(1)
      expect(result.issues[0]).toMatchObject({
        ruleId: 'deprecated-api',
        severity: 'high',
        message: 'Use of deprecated function detected',
        line: 1,
      })
    })

    it('should detect multiple issues in the same file', async () => {
      const fileContent: FileContent = {
        path: 'test.js',
        content: `
          function test() { 
            deprecated_function(); 
            eval('dangerous code');
          }
        `,
        type: 'javascript',
      }

      const result = await analyzer.analyzeFile(fileContent)

      expect(result.issues).toHaveLength(2)
      expect(result.issues.map(i => i.ruleId)).toContain('deprecated-api')
      expect(result.issues.map(i => i.ruleId)).toContain('security-issue')
    })

    it('should return no issues for clean code', async () => {
      const fileContent: FileContent = {
        path: 'clean.js',
        content: 'function clean() { return "Hello World"; }',
        type: 'javascript',
      }

      const result = await analyzer.analyzeFile(fileContent)

      expect(result.issues).toHaveLength(0)
    })

    it('should calculate correct line numbers', async () => {
      const fileContent: FileContent = {
        path: 'multiline.js',
        content: `
          // Line 1
          function test() {
            // Line 3
            deprecated_function(); // This should be line 5
          }
        `,
        type: 'javascript',
      }

      const result = await analyzer.analyzeFile(fileContent)

      expect(result.issues[0].line).toBe(5)
    })
  })

  describe('analyzeProject', () => {
    it('should analyze multiple files', async () => {
      const fileContents: FileContent[] = [
        {
          path: 'file1.js',
          content: 'deprecated_function();',
          type: 'javascript',
        },
        {
          path: 'file2.js',
          content: 'eval("test");',
          type: 'javascript',
        },
      ]

      const result = await analyzer.analyzeProject(fileContents)

      expect(result.files).toHaveLength(2)
      expect(result.summary.totalIssues).toBe(2)
      expect(result.summary.criticalIssues).toBe(1)
      expect(result.summary.highIssues).toBe(1)
    })

    it('should generate correct summary statistics', async () => {
      const fileContents: FileContent[] = [
        {
          path: 'file1.js',
          content: 'deprecated_function(); deprecated_function();',
          type: 'javascript',
        },
        {
          path: 'file2.js',
          content: 'clean code here',
          type: 'javascript',
        },
      ]

      const result = await analyzer.analyzeProject(fileContents)

      expect(result.summary).toMatchObject({
        totalFiles: 2,
        filesWithIssues: 1,
        totalIssues: 2,
        criticalIssues: 0,
        highIssues: 2,
        mediumIssues: 0,
        lowIssues: 0,
      })
    })
  })

  describe('generateRecommendations', () => {
    it('should generate recommendations based on detected issues', async () => {
      const scanResult: ScanResult = {
        id: 'scan-1',
        files: [
          {
            path: 'test.js',
            issues: [
              {
                id: 'issue-1',
                ruleId: 'deprecated-api',
                severity: 'high',
                message: 'Use of deprecated function detected',
                line: 1,
                column: 10,
                endLine: 1,
                endColumn: 20,
              },
            ],
            summary: {
              totalIssues: 1,
              criticalIssues: 0,
              highIssues: 1,
              mediumIssues: 0,
              lowIssues: 0,
            },
          },
        ],
        summary: {
          totalFiles: 1,
          filesWithIssues: 1,
          totalIssues: 1,
          criticalIssues: 0,
          highIssues: 1,
          mediumIssues: 0,
          lowIssues: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const recommendations = analyzer.generateRecommendations(scanResult)

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0]).toMatchObject({
        type: 'code_update',
        priority: 'high',
        category: 'compatibility',
      })
    })
  })

  describe('updateRules', () => {
    it('should update analyzer rules', () => {
      const newRules: CompatibilityRule[] = [
        {
          id: 'new-rule',
          name: 'New Rule',
          description: 'A new rule',
          category: 'performance',
          severity: 'medium',
          pattern: /console\.log/g,
          message: 'Console.log detected',
        },
      ]

      analyzer.updateRules(newRules)

      expect(analyzer.getRules()).toEqual(newRules)
    })
  })

  describe('getRules', () => {
    it('should return current rules', () => {
      const rules = analyzer.getRules()
      expect(rules).toEqual(mockRules)
    })
  })
})