export type Operator = 'AND' | 'OR' | 'NOT' | 'IMPLIES' | 'IFF' | 'XOR';

export interface ASTNode {
  id: string;
  type: 'VAR' | 'CONST' | Operator;
  value?: string | boolean; // boolean for CONST
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode; // for NOT
  expression: string; // The structural representation (e.g., "¬¬A")
  depth: number;
}

export interface TableColumn {
  id: string;
  label: string;
  expression: string;
  isInput: boolean;
  isOutput: boolean;
  astId?: string;
  dependencyIds?: string[];
}

export interface TruthTableRow {
  id: string;
  values: Record<string, boolean>;
  index: number;
}

export type Classification = 'Tautology' | 'Contradiction' | 'Contingency';

export interface ImplicationForms {
  original: string;
  converse: string;
  inverse: string;
  contrapositive: string;
}

// RightAway (RW) Types
export interface RWResult {
  active: boolean;
  value?: boolean | string; // true/false/variable name
  ruleName?: string;
  explanation?: string;
}

// STTT Types
export interface STTTStep {
  id: string;
  description: string;
  assignment?: string; // e.g. "A = 0"
  conflict?: boolean;
}

export interface STTTTrace {
  steps: STTTStep[];
  result: 'Proven' | 'Disproven';
  method: 'Assumption of False' | 'Assumption of True';
}

// K-Map Types
export interface KMapCell {
  value: boolean;
  mintermIndex: number;
}

export interface KMapGroupCell {
  r: number;
  c: number;
}

export interface KMapGroup {
  cells: KMapGroupCell[];
  color: string;
  term: string;
}

export interface KMapData {
  grid: KMapCell[][];
  rowLabels: string[];
  colLabels: string[];
  variables: string[];
  groups: KMapGroup[];
  minimizedExpression: string;
}

export interface ComplexityMetrics {
  variableCount: number;
  operatorCount: number;
  depth: number;
  rowCount: number;
  complexityScore: number; // calculated score
}

export interface AnalysisResult {
  ast: ASTNode;
  columns: TableColumn[];
  rows: TruthTableRow[];
  variables: string[];
  classification: Classification;
  mainConnective: Operator | 'VAR' | 'CONST';
  implicationForms?: ImplicationForms;
  kMapData?: KMapData;
  rwResult?: RWResult;
  stttTrace?: STTTTrace;
  complexity?: ComplexityMetrics;
  error?: string;
  processingTime?: number;
}

export interface AppSettings {
  logic: {
    negationHandling: 'preserve' | 'normalize' | 'simplify';
    truthValues: '0/1' | 'F/T';
    rowOrder: '0→1' | '1→0';
  };
  table: {
    stickyHeaders: boolean;
    showSubExpressions: boolean;
    highlightDependencies: boolean;
    dense: boolean;
  };
  system: {
    preventRefresh: boolean;
    geminiApiKey: string;
    enableAI: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  logic: {
    negationHandling: 'preserve',
    truthValues: '0/1',
    rowOrder: '0→1',
  },
  table: {
    stickyHeaders: true,
    showSubExpressions: true,
    highlightDependencies: true,
    dense: false,
  },
  system: {
    preventRefresh: true,
    geminiApiKey: '',
    enableAI: false
  }
};

export interface HistoryItem {
  id: string;
  expression: string;
  timestamp: number;
  classification?: string;
}

export interface ProofStep {
  id: string;
  content: string;
  justification: string;
  isAssumption: boolean;
}
