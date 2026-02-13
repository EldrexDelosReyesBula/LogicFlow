
export type Operator = 'AND' | 'OR' | 'NOT' | 'IMPLIES' | 'IFF' | 'XOR';

export interface ASTNode {
  id: string;
  type: 'VAR' | Operator;
  value?: string;
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode; 
  expression: string; 
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

// STTT Types
export type STTTProofType = 'Tautology' | 'Contradiction' | 'Contingency' | 'Implication' | 'Equivalence';

export type AssignmentMap = Record<string, boolean>;

export interface STTTStep {
    id: string;
    description: string;
    targetNodeExpression: string;
    value: boolean;
    reason: string;
}

export interface STTTContradiction {
    variable: string;
    val1: boolean;
    val2: boolean;
}

export interface STTTBranch {
    id: string;
    parentId?: string;
    steps: STTTStep[];
    assignments: AssignmentMap;
    status: 'Open' | 'Closed' | 'Complete';
    children?: STTTBranch[];
    contradiction?: STTTContradiction;
}

export interface STTTReport {
    target: STTTProofType;
    rootBranch: STTTBranch;
    result: 'Proven' | 'Disproven';
    counterExample?: AssignmentMap;
    textSummary: string;
    proofTitle: string;
    initialAssumptions: { expr: string, val: boolean }[];
}

export interface RightAwayResult {
  isApplicable: boolean;
  variable?: string;
  resultValue?: boolean;
  explanation?: string;
}

export interface ComplexityMetrics {
  operators: number;
  depth: number;
  totalRows: number;
}

export interface SimplificationStep {
  expression: string;
  rule: string;
}

export interface AnalysisResult {
  ast: ASTNode;
  columns: TableColumn[];
  rows: TruthTableRow[];
  variables: string[]; 
  classification: Classification;
  mainConnective: Operator | 'VAR';
  implicationForms?: ImplicationForms;
  kMapData?: KMapData;
  error?: string; 
  
  // New properties
  rightAway?: RightAwayResult;
  complexity: ComplexityMetrics;
  simplificationSteps?: SimplificationStep[];
  sttt?: STTTReport;
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
}

export const DEFAULT_SETTINGS: AppSettings = {
  logic: {
    negationHandling: 'preserve',
    truthValues: '0/1',
    rowOrder: '1→0',
  },
  table: {
    stickyHeaders: true,
    showSubExpressions: true,
    highlightDependencies: true,
    dense: false,
  },
};

export interface HistoryItem {
    id: string;
    expression: string;
    variables: string[];
    timestamp: number;
    classification: Classification;
}

export interface ProofStep {
    id: string;
    content: string;
    justification: string;
    isValid?: boolean;
    error?: string;
}

export interface WorkspaceState {
    premises: string; 
    conclusion: string; 
    steps: ProofStep[];
}
