import { SecurityLogEntry, CompatibilityDataEntry } from '@/lib/upload/file-handler';
import { cache } from '@/lib/db/redis';

// Define types locally since schema doesn't have them
export enum RuleSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ResultStatus {
  PASSED = 'passed',
  WARNING = 'warning',
  FAILED = 'failed',
  ERROR = 'error',
}

export interface CompatibilityRule {
  id: string | number;
  name: string;
  description?: string;
  category: string;
  severity: string;
  conditions?: any;
  recommendations?: string;
  isActive: boolean;
}

// Analysis result interface
export interface AnalysisResult {
  ruleId: string | number;
  status: ResultStatus;
  severity: RuleSeverity;
  message: string;
  details: any;
  recommendations: string;
  affectedComponents: string[];
  metadata: any;
  confidence: number; // 0-1 confidence score
}

// AI Analysis Context
export interface AnalysisContext {
  sessionId: string;
  userId: number;
  organizationId?: number;
  dataType: 'security_log' | 'compatibility_data';
  rules: CompatibilityRule[];
  historicalData?: AnalysisResult[];
}

// Risk scoring weights
const SEVERITY_WEIGHTS = {
  [RuleSeverity.LOW]: 1,
  [RuleSeverity.MEDIUM]: 3,
  [RuleSeverity.HIGH]: 7,
  [RuleSeverity.CRITICAL]: 10,
} as const;

// Pattern matching engine
export class PatternMatcher {
  private patterns: Map<string, RegExp> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns() {
    // Security vulnerability patterns
    this.patterns.set('sql_injection', /(?:union|select|insert|update|delete|drop|exec|script)\s*[(;]/gi);
    this.patterns.set('xss', /(?:<script|javascript:|vbscript:|onload|onerror|onclick)/gi);
    this.patterns.set('path_traversal', /(?:(?:\.\.)[\/\\]|%2e%2e[%2f%5c])/gi);
    this.patterns.set('command_injection', /(?:;\s*(?:rm|del|format|shutdown)|\|\s*(?:nc|netcat|telnet))/gi);
    this.patterns.set('authentication_bypass', /(?:admin|administrator|root).*(?:password|pwd|pass).*(?:=|:)\s*(?:"|')?(?:admin|password|123|blank)?/gi);
    this.patterns.set('sensitive_data', /(?:api[_-]?key|secret|token|password|credential|private[_-]?key)\s*[=:]\s*["']?[a-zA-Z0-9+\/]{8,}["']?/gi);
    
    // Compatibility issue patterns
    this.patterns.set('version_conflict', /version\s+(?:conflict|mismatch|incompatibl)/gi);
    this.patterns.set('deprecated_api', /(?:deprecated|obsolete|legacy)\s+(?:api|method|function)/gi);
    this.patterns.set('missing_dependency', /(?:missing|not\s+found|undefined)\s+(?:dependency|module|library)/gi);
    this.patterns.set('configuration_error', /(?:configuration|config)\s+(?:error|invalid|missing)/gi);
  }

  match(text: string, patternName?: string): { pattern: string; matches: RegExpMatchArray[] }[] {
    const results: { pattern: string; matches: RegExpMatchArray[] }[] = [];
    
    const patternsToCheck = patternName 
      ? [[patternName, this.patterns.get(patternName)!]]
      : Array.from(this.patterns.entries());

    for (const [name, pattern] of patternsToCheck) {
      if (!pattern) continue;
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length > 0) {
        results.push({ pattern: name, matches });
      }
    }

    return results;
  }
}

// Machine Learning-inspired analysis
export class MLAnalyzer {
  private featureWeights: Map<string, number> = new Map();
  private patternMatcher: PatternMatcher;

  constructor() {
    this.patternMatcher = new PatternMatcher();
    this.initializeFeatureWeights();
  }

  private initializeFeatureWeights() {
    // Security feature weights
    this.featureWeights.set('sql_injection', 0.9);
    this.featureWeights.set('xss', 0.8);
    this.featureWeights.set('path_traversal', 0.85);
    this.featureWeights.set('command_injection', 0.95);
    this.featureWeights.set('authentication_bypass', 0.9);
    this.featureWeights.set('sensitive_data', 0.7);
    
    // Compatibility feature weights
    this.featureWeights.set('version_conflict', 0.8);
    this.featureWeights.set('deprecated_api', 0.6);
    this.featureWeights.set('missing_dependency', 0.75);
    this.featureWeights.set('configuration_error', 0.7);
  }

  extractFeatures(data: SecurityLogEntry | CompatibilityDataEntry): Map<string, number> {
    const features = new Map<string, number>();
    
    // Convert data to searchable text
    const searchText = JSON.stringify(data).toLowerCase();
    
    // Pattern-based features
    const patternMatches = this.patternMatcher.match(searchText);
    for (const { pattern, matches } of patternMatches) {
      const weight = this.featureWeights.get(pattern) || 0.5;
      features.set(`pattern_${pattern}`, matches.length * weight);
    }
    
    // Statistical features
    if ('severity' in data) {
      const severityScore = SEVERITY_WEIGHTS[data.severity as RuleSeverity] || 1;
      features.set('severity_score', severityScore / 10); // Normalize to 0-1
    }
    
    // Text complexity features
    const messageLength = ('message' in data ? data.message?.length : 0) || 0;
    features.set('message_complexity', Math.min(messageLength / 1000, 1)); // Normalize
    
    // Tool-specific features
    if ('tool' in data) {
      const toolReliability = this.getToolReliabilityScore(data.tool);
      features.set('tool_reliability', toolReliability);
    }
    
    return features;
  }

  private getToolReliabilityScore(tool: string): number {
    const reliabilityMap: Record<string, number> = {
      'sonarqube': 0.9,
      'owasp_zap': 0.85,
      'burp_suite': 0.9,
      'nessus': 0.8,
      'qualys': 0.8,
      'veracode': 0.85,
      'checkmarx': 0.8,
      'fortify': 0.8,
      'snyk': 0.85,
      'semgrep': 0.8,
    };
    
    const normalizedTool = tool.toLowerCase().replace(/\s+/g, '_');
    return reliabilityMap[normalizedTool] || 0.7; // Default reliability
  }

  calculateRiskScore(features: Map<string, number>, historicalData?: AnalysisResult[]): number {
    let score = 0;
    let totalWeight = 0;
    
    // Base score from features
    for (const [feature, value] of features) {
      const weight = this.getFeatureWeight(feature);
      score += value * weight;
      totalWeight += weight;
    }
    
    // Normalize base score
    const baseScore = totalWeight > 0 ? score / totalWeight : 0;
    
    // Adjust based on historical patterns
    let historicalAdjustment = 0;
    if (historicalData && historicalData.length > 0) {
      const recentFailures = historicalData
        .filter(r => r.status === ResultStatus.FAILED)
        .length;
      const totalRecent = Math.min(historicalData.length, 10);
      historicalAdjustment = (recentFailures / totalRecent) * 0.2; // Max 20% adjustment
    }
    
    return Math.min(baseScore + historicalAdjustment, 1);
  }

  private getFeatureWeight(feature: string): number {
    if (feature.startsWith('pattern_')) {
      const pattern = feature.replace('pattern_', '');
      return this.featureWeights.get(pattern) || 0.5;
    }
    
    const weights: Record<string, number> = {
      'severity_score': 0.8,
      'message_complexity': 0.3,
      'tool_reliability': 0.6,
    };
    
    return weights[feature] || 0.5;
  }
}

// Main compatibility analysis engine
export class CompatibilityAnalysisEngine {
  private mlAnalyzer: MLAnalyzer;
  private patternMatcher: PatternMatcher;

  constructor() {
    this.mlAnalyzer = new MLAnalyzer();
    this.patternMatcher = new PatternMatcher();
  }

  async analyzeData(
    data: (SecurityLogEntry | CompatibilityDataEntry)[],
    context: AnalysisContext
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    
    // Cache key for historical data
    const historicalCacheKey = `analysis_history:${context.userId}:${context.organizationId || 'personal'}`;
    
    try {
      // Get historical analysis data for ML insights
      const historicalData = await cache.get<AnalysisResult[]>(historicalCacheKey) || [];
      
      // Analyze each data entry against all rules
      for (const entry of data) {
        for (const rule of context.rules) {
          const result = await this.analyzeEntry(entry, rule, historicalData);
          if (result) {
            results.push(result);
          }
        }
      }
      
      // Update historical data cache
      const updatedHistorical = [...historicalData, ...results].slice(-100); // Keep last 100 results
      await cache.set(historicalCacheKey, updatedHistorical, 24 * 60 * 60); // 24 hours TTL
      
    } catch (error) {
      console.error('Analysis engine error:', error);
      throw new Error('Failed to analyze compatibility data');
    }
    
    return results;
  }

  private async analyzeEntry(
    entry: SecurityLogEntry | CompatibilityDataEntry,
    rule: CompatibilityRule,
    historicalData: AnalysisResult[]
  ): Promise<AnalysisResult | null> {
    try {
      // Check if rule conditions match the entry
      const matchResult = this.evaluateRuleConditions(entry, rule.conditions as any);
      if (!matchResult.matches) {
        return null;
      }
      
      // Extract ML features
      const features = this.mlAnalyzer.extractFeatures(entry);
      
      // Calculate risk score
      const riskScore = this.mlAnalyzer.calculateRiskScore(features, historicalData);
      
      // Determine result status based on risk score and rule severity
      const status = this.determineResultStatus(riskScore, rule.severity as RuleSeverity);
      
      // Generate detailed analysis
      const analysis = this.generateDetailedAnalysis(entry, rule, features, matchResult);
      
      return {
        ruleId: rule.id,
        status,
        severity: rule.severity as RuleSeverity,
        message: analysis.message,
        details: analysis.details,
        recommendations: analysis.recommendations,
        affectedComponents: analysis.affectedComponents,
        metadata: {
          riskScore,
          features: Array.from(features.entries()),
          matchedConditions: matchResult.matchedConditions,
          confidence: this.calculateConfidence(riskScore, features),
        },
        confidence: this.calculateConfidence(riskScore, features),
      };
      
    } catch (error) {
      console.error('Entry analysis error:', error);
      return null;
    }
  }

  private evaluateRuleConditions(entry: any, conditions: any): {
    matches: boolean;
    matchedConditions: string[];
  } {
    const matchedConditions: string[] = [];
    
    if (!conditions || typeof conditions !== 'object') {
      return { matches: false, matchedConditions };
    }
    
    // Evaluate each condition
    for (const [key, condition] of Object.entries(conditions)) {
      if (this.evaluateCondition(entry, key, condition)) {
        matchedConditions.push(key);
      }
    }
    
    // Rule matches if any condition is met (OR logic)
    // For AND logic, change this to check if all conditions match
    const matches = matchedConditions.length > 0;
    
    return { matches, matchedConditions };
  }

  private evaluateCondition(entry: any, key: string, condition: any): boolean {
    const value = this.getValueByPath(entry, key);
    
    if (condition === null || condition === undefined) {
      return value === null || value === undefined;
    }
    
    if (typeof condition === 'string') {
      if (condition.startsWith('/') && condition.endsWith('/')) {
        // Regex condition
        const regex = new RegExp(condition.slice(1, -1), 'i');
        return regex.test(String(value));
      }
      return String(value).toLowerCase().includes(condition.toLowerCase());
    }
    
    if (typeof condition === 'object') {
      // Complex condition object
      if (condition.$regex) {
        const regex = new RegExp(condition.$regex, condition.$options || 'i');
        return regex.test(String(value));
      }
      
      if (condition.$in && Array.isArray(condition.$in)) {
        return condition.$in.includes(value);
      }
      
      if (condition.$gt !== undefined) {
        return Number(value) > Number(condition.$gt);
      }
      
      if (condition.$lt !== undefined) {
        return Number(value) < Number(condition.$lt);
      }
      
      if (condition.$eq !== undefined) {
        return value === condition.$eq;
      }
    }
    
    return value === condition;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private determineResultStatus(riskScore: number, severity: RuleSeverity): ResultStatus {
    const severityThresholds = {
      [RuleSeverity.LOW]: 0.3,
      [RuleSeverity.MEDIUM]: 0.5,
      [RuleSeverity.HIGH]: 0.7,
      [RuleSeverity.CRITICAL]: 0.9,
    };
    
    const threshold = severityThresholds[severity];
    
    if (riskScore >= threshold) {
      return ResultStatus.FAILED;
    } else if (riskScore >= threshold * 0.7) {
      return ResultStatus.WARNING;
    } else {
      return ResultStatus.PASSED;
    }
  }

  private generateDetailedAnalysis(
    entry: SecurityLogEntry | CompatibilityDataEntry,
    rule: CompatibilityRule,
    features: Map<string, number>,
    matchResult: { matches: boolean; matchedConditions: string[] }
  ) {
    // Generate context-aware message
    let message = rule.description || `Compatibility issue detected: ${rule.name}`;
    
    // Add specific details based on matched patterns
    const patternFeatures = Array.from(features.entries())
      .filter(([key]) => key.startsWith('pattern_'))
      .filter(([, value]) => value > 0);
    
    if (patternFeatures.length > 0) {
      const patterns = patternFeatures.map(([key]) => key.replace('pattern_', ''));
      message += ` Detected patterns: ${patterns.join(', ')}`;
    }
    
    // Extract affected components
    const affectedComponents: string[] = [];
    
    if ('tool' in entry) {
      affectedComponents.push(`Security Tool: ${entry.tool}`);
    }
    
    if ('application' in entry) {
      affectedComponents.push(`Application: ${entry.application}`);
      if (entry.version) {
        affectedComponents.push(`Version: ${entry.version}`);
      }
    }
    
    // Generate recommendations
    let recommendations = rule.recommendations || 'No specific recommendations available.';
    
    if (patternFeatures.some(([key]) => key.includes('sql_injection'))) {
      recommendations += ' Consider implementing parameterized queries and input validation.';
    }
    
    if (patternFeatures.some(([key]) => key.includes('xss'))) {
      recommendations += ' Implement proper output encoding and Content Security Policy.';
    }
    
    if (patternFeatures.some(([key]) => key.includes('version_conflict'))) {
      recommendations += ' Update dependencies to compatible versions.';
    }
    
    return {
      message,
      details: {
        originalEntry: entry,
        matchedConditions: matchResult.matchedConditions,
        detectedPatterns: patternFeatures.map(([key, value]) => ({ pattern: key, score: value })),
        analysisTimestamp: new Date().toISOString(),
      },
      recommendations,
      affectedComponents,
    };
  }

  private calculateConfidence(riskScore: number, features: Map<string, number>): number {
    // Base confidence from risk score
    let confidence = riskScore;
    
    // Adjust based on number of features
    const featureCount = features.size;
    const featureBonus = Math.min(featureCount / 10, 0.2); // Max 20% bonus
    confidence += featureBonus;
    
    // Adjust based on pattern matches
    const patternMatches = Array.from(features.entries())
      .filter(([key, value]) => key.startsWith('pattern_') && value > 0)
      .length;
    
    if (patternMatches > 0) {
      confidence += Math.min(patternMatches / 5, 0.3); // Max 30% bonus
    }
    
    return Math.min(confidence, 1); // Cap at 1.0
  }
}

// Utility function to calculate overall risk score for a scan session
export function calculateOverallRiskScore(results: AnalysisResult[]): number {
  if (results.length === 0) return 0;
  
  const weights = {
    [ResultStatus.FAILED]: 1.0,
    [ResultStatus.WARNING]: 0.6,
    [ResultStatus.PASSED]: 0.1,
    [ResultStatus.ERROR]: 0.8,
  };
  
  const severityMultipliers = {
    [RuleSeverity.CRITICAL]: 2.0,
    [RuleSeverity.HIGH]: 1.5,
    [RuleSeverity.MEDIUM]: 1.0,
    [RuleSeverity.LOW]: 0.5,
  };
  
  let totalScore = 0;
  let maxPossibleScore = 0;
  
  for (const result of results) {
    const statusWeight = weights[result.status];
    const severityMultiplier = severityMultipliers[result.severity];
    const confidence = result.confidence;
    
    const resultScore = statusWeight * severityMultiplier * confidence;
    const maxResultScore = 1.0 * 2.0 * 1.0; // Max possible for any result
    
    totalScore += resultScore;
    maxPossibleScore += maxResultScore;
  }
  
  return maxPossibleScore > 0 ? Math.min(totalScore / maxPossibleScore, 1) : 0;
}
