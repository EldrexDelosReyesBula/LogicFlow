import { AnalysisResult, ASTNode, Classification, TableColumn, TruthTableRow, Operator, ImplicationForms, AppSettings, KMapData, KMapCell, KMapGroup, KMapGroupCell } from '../types';

// --- Constants & Types ---
const OPS: Record<string, string> = {
  '->': '→', '=>': '→', 'IMPLIES': '→',
  '<->': '↔', '<=>': '↔', 'IFF': '↔',
  '&': '∧', '&&': '∧', 'AND': '∧',
  '|': '∨', '||': '∨', 'OR': '∨',
  '!': '¬', '~': '¬', '-': '¬', 'NOT': '¬',
  '^': '⊕', 'XOR': '⊕'
};

const SYMBOLS = {
  NOT: '¬', AND: '∧', OR: '∨', IMPLIES: '→', IFF: '↔', XOR: '⊕',
  LPAREN: '(', RPAREN: ')'
};

// --- Helper: Format Logic String based on Settings ---
const formatLabel = (expr: string, settings: AppSettings): string => {
    if (settings.logic.negationHandling === 'preserve') return expr;
    
    // Normalize: Replace all negation symbols with ¬
    let normalized = expr.replace(/[-!~]/g, '¬');
    
    if (settings.logic.negationHandling === 'normalize') return normalized;
    
    if (settings.logic.negationHandling === 'simplify') {
        // Remove double negations: ¬¬A -> A
        // We run a loop until no more double negations exist
        let prev = '';
        while (normalized !== prev) {
            prev = normalized;
            normalized = normalized.replace(/¬¬/g, '');
        }
        return normalized || '¬¬'; // Fallback if it reduced to empty (shouldn't happen for valid exprs)
    }
    return expr;
};

// --- Tokenizer ---
interface Token { type: 'VAR' | Operator | 'LPAREN' | 'RPAREN' | 'EOF'; value: string; }

const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  // Normalize groupings to parens for parsing ease
  const str = input.toUpperCase()
    .replace(/[\[\{]/g, '(').replace(/[\]\}]/g, ')')
    .replace(/\s+/g, '');

  while (i < str.length) {
    const char = str[i];
    
    // Check multi-char operators first
    const remainder = str.slice(i);
    let matchedOp = false;
    
    const opKeys = Object.keys(OPS).sort((a, b) => b.length - a.length);
    
    for (const key of opKeys) {
      if (remainder.startsWith(key)) {
        let type: any = 'VAR';
        const symbol = OPS[key];
        // For AST consistency, we map all input NOT symbols to generic 'NOT' type,
        // BUT we preserve the token value for "Preserve" mode display
        if (symbol === '¬') type = 'NOT';
        else if (symbol === '∧') type = 'AND';
        else if (symbol === '∨') type = 'OR';
        else if (symbol === '→') type = 'IMPLIES';
        else if (symbol === '↔') type = 'IFF';
        else if (symbol === '⊕') type = 'XOR';
        
        // Special handling: Keep exact negation char if user typed '-', but map to NOT type
        const rawValue = key === '-' ? '-' : (key === '--' ? '--' : symbol);
        
        tokens.push({ type, value: rawValue === '-' ? '-' : symbol }); 
        i += key.length;
        matchedOp = true;
        break;
      }
    }
    if (matchedOp) continue;

    if (Object.values(SYMBOLS).includes(char)) {
       let type: any = 'VAR';
       if (char === '¬') type = 'NOT';
       else if (char === '∧') type = 'AND';
       else if (char === '∨') type = 'OR';
       else if (char === '→') type = 'IMPLIES';
       else if (char === '↔') type = 'IFF';
       else if (char === '⊕') type = 'XOR';
       else if (char === '(') type = 'LPAREN';
       else if (char === ')') type = 'RPAREN';
       tokens.push({ type, value: char });
       i++;
    } else if (/[A-Z]/.test(char) || char === '1' || char === '0') {
      tokens.push({ type: 'VAR', value: char });
      i++;
    } else if (char === '-') { 
      // Fallback for single hyphen if not caught by ops
      tokens.push({ type: 'NOT', value: '-' });
      i++;
    } else {
      i++;
    }
  }
  tokens.push({ type: 'EOF', value: '' });
  return tokens;
};

// --- Strict AST Parser ---
// v3.0 Rule: No normalization during parsing. Structure reflects input.

class Parser {
  tokens: Token[];
  pos: number = 0;
  nodeIdCounter: number = 0;

  constructor(tokens: Token[]) { this.tokens = tokens; }
  peek() { return this.tokens[this.pos]; }
  consume() { return this.tokens[this.pos++]; }
  
  generateId() { return `node-${this.nodeIdCounter++}`; }

  parse(): ASTNode {
    const node = this.parseIFF();
    if (this.peek().type !== 'EOF' && this.peek().type !== 'RPAREN') {
      throw new Error("Unexpected token");
    }
    return node;
  }

  parseIFF(): ASTNode {
    let left = this.parseImplies();
    while (this.peek().type === 'IFF') {
      this.consume();
      const right = this.parseImplies();
      left = {
        id: this.generateId(), type: 'IFF', left, right,
        expression: `(${left.expression} ↔ ${right.expression})`,
        depth: Math.max(left.depth, right.depth) + 1
      };
    }
    return left;
  }

  parseImplies(): ASTNode {
    let left = this.parseXor();
    while (this.peek().type === 'IMPLIES') {
      this.consume();
      const right = this.parseXor();
      left = {
        id: this.generateId(), type: 'IMPLIES', left, right,
        expression: `(${left.expression} → ${right.expression})`,
        depth: Math.max(left.depth, right.depth) + 1
      };
    }
    return left;
  }

  parseXor(): ASTNode {
    let left = this.parseOr();
    while (this.peek().type === 'XOR') {
      this.consume();
      const right = this.parseOr();
      left = {
        id: this.generateId(), type: 'XOR', left, right,
        expression: `(${left.expression} ⊕ ${right.expression})`,
        depth: Math.max(left.depth, right.depth) + 1
      };
    }
    return left;
  }

  parseOr(): ASTNode {
    let left = this.parseAnd();
    while (this.peek().type === 'OR') {
      this.consume();
      const right = this.parseAnd();
      left = {
        id: this.generateId(), type: 'OR', left, right,
        expression: `(${left.expression} ∨ ${right.expression})`,
        depth: Math.max(left.depth, right.depth) + 1
      };
    }
    return left;
  }

  parseAnd(): ASTNode {
    // Note: We call parseNot here
    let left = this.parseNot();
    while (this.peek().type === 'AND') {
      this.consume();
      const right = this.parseNot();
      left = {
        id: this.generateId(), type: 'AND', left, right,
        expression: `(${left.expression} ∧ ${right.expression})`,
        depth: Math.max(left.depth, right.depth) + 1
      };
    }
    return left;
  }

  // v3.0: Strict recursive NOT parsing. No loop collapsing.
  parseNot(): ASTNode {
    if (this.peek().type === 'NOT') {
      const token = this.consume();
      const operand = this.parseNot();
      return {
        id: this.generateId(), type: 'NOT', operand,
        // We construct the expression string using the exact token (e.g., "-A" or "¬A")
        expression: `${token.value}${operand.expression}`,
        depth: operand.depth + 1
      };
    }
    return this.parseFactor();
  }

  parseFactor(): ASTNode {
    const token = this.peek();
    if (token.type === 'LPAREN') {
      this.consume();
      const node = this.parseIFF();
      if (this.peek().type === 'RPAREN') this.consume();
      return node;
    } else if (token.type === 'VAR') {
      this.consume();
      return {
        id: this.generateId(), type: 'VAR', value: token.value,
        expression: token.value,
        depth: 0
      };
    }
    throw new Error(`Unexpected token: ${token.value}`);
  }
}

// --- Evaluator ---

const evaluateAST = (node: ASTNode, context: Record<string, boolean>): boolean => {
  if (node.type === 'VAR') {
    if (node.value === '1') return true;
    if (node.value === '0') return false;
    return context[node.value!] ?? false;
  }
  if (node.type === 'NOT') return !evaluateAST(node.operand!, context);
  
  const l = evaluateAST(node.left!, context);
  const r = evaluateAST(node.right!, context);

  switch (node.type) {
    case 'AND': return l && r;
    case 'OR': return l || r;
    case 'XOR': return l !== r;
    case 'IMPLIES': return !l || r;
    case 'IFF': return l === r;
    default: return false;
  }
};

const extractSubExpressions = (node: ASTNode, list: ASTNode[] = []) => {
  if (node.left) extractSubExpressions(node.left, list);
  if (node.right) extractSubExpressions(node.right, list);
  if (node.operand) extractSubExpressions(node.operand, list);
  
  if (!list.find(n => n.expression === node.expression)) {
    list.push(node);
  }
  return list;
};

const getDirectDependencies = (node: ASTNode): string[] => {
    const deps: string[] = [];
    if (node.left) deps.push(node.left.id);
    if (node.right) deps.push(node.right.id);
    if (node.operand) deps.push(node.operand.id);
    return deps;
};

// --- Re-Evaluation Helper ---

export const recalculateRow = (
    row: TruthTableRow,
    columns: TableColumn[],
    ast: ASTNode
): TruthTableRow => {
    const subExprNodes = extractSubExpressions(ast);
    const context: Record<string, boolean> = {};
    
    // 1. Collect inputs from the row
    columns.filter(c => c.isInput).forEach(c => {
        context[c.expression] = row.values[c.expression];
    });

    const newValues = { ...row.values };

    // 2. Evaluate derived columns
    columns.forEach(col => {
        if (!col.isInput) {
             const node = subExprNodes.find(n => n.id === col.astId) 
                     || (col.astId === ast.id ? ast : undefined);
             if (node) {
                 newValues[col.expression] = evaluateAST(node, context);
             }
        }
    });

    return { ...row, values: newValues };
};

// --- K-Map Logic ---

const getGrayCode = (n: number): string[] => {
    if (n === 1) return ['0', '1'];
    if (n === 2) return ['00', '01', '11', '10'];
    return [];
};

const generateKMap = (variables: string[], rows: TruthTableRow[]): KMapData | undefined => {
    const numVars = variables.length;
    if (numVars < 2 || numVars > 4) return undefined;

    let rowVars: string[] = [];
    let colVars: string[] = [];
    
    if (numVars === 2) {
        rowVars = [variables[0]];
        colVars = [variables[1]];
    } else if (numVars === 3) {
        rowVars = [variables[0]];
        colVars = variables.slice(1);
    } else {
        rowVars = variables.slice(0, 2);
        colVars = variables.slice(2);
    }

    const rowGray = getGrayCode(rowVars.length);
    const colGray = getGrayCode(colVars.length);

    const grid: KMapCell[][] = [];
    const mintermToCell = new Map<number, {r:number, c:number}>();
    const onMinterms = new Set<number>();
    // Value from rows
    const mintermMap = new Map<number, boolean>();

    // Build minterm map from rows first for easy lookup
    rows.forEach(row => {
        let minterm = 0;
        variables.forEach((v, i) => {
            if (row.values[v]) {
                minterm |= (1 << (variables.length - 1 - i));
            }
        });
        const resultVal = Object.values(row.values)[Object.values(row.values).length - 1]; 
        mintermMap.set(minterm, resultVal);
        if (resultVal) onMinterms.add(minterm);
    });

    // Build grid
    for (let r = 0; r < rowGray.length; r++) {
        const rowData: KMapCell[] = [];
        for (let c = 0; c < colGray.length; c++) {
            const bits = rowGray[r] + colGray[c];
            const mintermIndex = parseInt(bits, 2);
            const value = mintermMap.get(mintermIndex) || false;
            
            rowData.push({ value, mintermIndex });
            mintermToCell.set(mintermIndex, {r, c});
        }
        grid.push(rowData);
    }

    // Grouping
    const { groups, minimizedExpression } = solveKMap(grid, onMinterms, rowVars, colVars, rowGray, colGray);

    return {
        variables,
        grid,
        rowLabels: rowGray,
        colLabels: colGray,
        groups,
        minimizedExpression: minimizedExpression || (onMinterms.size === 0 ? '0' : '1')
    };
};

// Simplified Grouping Algorithm
const solveKMap = (
    grid: KMapCell[][], 
    onMinterms: Set<number>, 
    rowVars: string[], 
    colVars: string[],
    rowGray: string[],
    colGray: string[]
) => {
    const rows = grid.length;
    const cols = grid[0].length;
    const groups: KMapGroup[] = [];
    const coveredMinterms = new Set<number>();
    
    // Available colors for groups
    const colors = [
        'bg-red-500/20 border-red-500', 
        'bg-blue-500/20 border-blue-500', 
        'bg-green-500/20 border-green-500', 
        'bg-yellow-500/20 border-yellow-500',
        'bg-purple-500/20 border-purple-500',
        'bg-orange-500/20 border-orange-500'
    ];

    // Check all possible rectangle sizes (powers of 2), strictly descending area
    const sizes = [];
    for (let h of [4, 2, 1]) {
        for (let w of [4, 2, 1]) {
            if (h <= rows && w <= cols) {
                // Area must be power of 2
                if (Number.isInteger(Math.log2(h * w))) {
                    sizes.push({h, w, area: h*w});
                }
            }
        }
    }
    sizes.sort((a, b) => b.area - a.area);

    for (const size of sizes) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Check if rectangle at (r, c) with size (h, w) consists only of 1s
                let allOnes = true;
                const cells: KMapGroupCell[] = [];
                const currentMinterms = new Set<number>();

                for (let i = 0; i < size.h; i++) {
                    for (let j = 0; j < size.w; j++) {
                        const rr = (r + i) % rows;
                        const cc = (c + j) % cols;
                        if (!grid[rr][cc].value) {
                            allOnes = false;
                            break;
                        }
                        cells.push({r: rr, c: cc});
                        currentMinterms.add(grid[rr][cc].mintermIndex);
                    }
                    if (!allOnes) break;
                }

                if (allOnes) {
                    // Check if this group covers at least one NEW minterm
                    let coversNew = false;
                    currentMinterms.forEach(m => {
                        if (!coveredMinterms.has(m)) coversNew = true;
                    });

                    if (coversNew) {
                        // Create term string
                        const term = generateTerm(currentMinterms, rowVars, colVars, rowGray.length, colGray.length);
                        
                        groups.push({
                            cells,
                            color: colors[groups.length % colors.length],
                            term
                        });
                        
                        currentMinterms.forEach(m => coveredMinterms.add(m));
                    }
                }
            }
        }
    }

    return { 
        groups, 
        minimizedExpression: groups.map(g => g.term).join(' ∨ ') 
    };
};

const generateTerm = (minterms: Set<number>, rowVars: string[], colVars: string[], numRows: number, numCols: number) => {
    // Check which bits are constant across all minterms
    const allVars = [...rowVars, ...colVars];
    const totalBits = allVars.length;
    let term = '';

    for (let i = 0; i < totalBits; i++) {
        let bitVal: number | null = null;
        let isConstant = true;

        for (const m of Array.from(minterms)) {
            const bit = (m >> (totalBits - 1 - i)) & 1;
            if (bitVal === null) {
                bitVal = bit;
            } else if (bitVal !== bit) {
                isConstant = false;
                break;
            }
        }

        if (isConstant && bitVal !== null) {
            term += bitVal === 1 ? allVars[i] : `¬${allVars[i]}`;
        }
    }
    
    return term || '1';
};

// --- Main Analysis Function ---

export const extractVariablesFromExpression = (expression: string): string[] => {
  try {
    const tokens = tokenize(expression);
    const vars = new Set<string>();
    tokens.forEach(t => { if (t.type === 'VAR' && !['0', '1'].includes(t.value)) vars.add(t.value); });
    return Array.from(vars).sort();
  } catch { return []; }
};

export const analyzeLogic = (
    expression: string, 
    declaredVariables: string[], 
    settings: AppSettings
): AnalysisResult => {
  
  // 1. Parse
  const tokens = tokenize(expression);
  const parser = new Parser(tokens);
  const ast = parser.parse();
  
  // 2. Validate Variables
  const usedVariables = extractVariablesFromExpression(expression);
  const undeclared = usedVariables.filter(v => !declaredVariables.includes(v));
  if (undeclared.length > 0) {
      throw new Error(`Variable${undeclared.length > 1 ? 's' : ''} ${undeclared.join(', ')} used but not declared.`);
  }
  
  // 3. Columns
  const subExprNodes = extractSubExpressions(ast);
  
  // Input Columns (Strictly based on declared variables, in declared order)
  const varColumns: TableColumn[] = declaredVariables.map(v => ({
    id: `var-${v}`, 
    label: v, 
    expression: v, 
    isInput: true, 
    isOutput: false
  }));
  
  // Intermediate Columns
  const stepColumns: TableColumn[] = subExprNodes
    .filter(n => n.type !== 'VAR' && n.expression !== ast.expression)
    .map(n => ({
      id: n.id, 
      label: formatLabel(n.expression, settings), 
      expression: n.expression, 
      isInput: false, 
      isOutput: false, 
      astId: n.id,
      dependencyIds: getDirectDependencies(n)
    }));
    
  // Result Column
  const resultColumn: TableColumn = {
    id: ast.id, 
    label: formatLabel(ast.expression, settings), 
    expression: ast.expression, 
    isInput: false, 
    isOutput: true, 
    astId: ast.id,
    dependencyIds: getDirectDependencies(ast)
  };

  // Filter out steps if disabled in settings
  const finalColumns = settings.table.showSubExpressions 
     ? [...varColumns, ...stepColumns, resultColumn]
     : [...varColumns, resultColumn];

  // 4. Rows (2^n)
  const numRows = Math.pow(2, declaredVariables.length);
  const rows: TruthTableRow[] = [];
  let tautology = true;
  let contradiction = true;

  for (let i = 0; i < numRows; i++) {
    let valIndex = i;
    // Row Order Handling
    if (settings.logic.rowOrder === '1→0') {
        valIndex = (numRows - 1) - i;
    }

    const context: Record<string, boolean> = {};
    declaredVariables.forEach((v, idx) => {
      // Standard binary enumeration: 00...00 to 11...11
      // If rowOrder is 1->0, we inverted valIndex above.
      const bit = (valIndex >> (declaredVariables.length - 1 - idx)) & 1;
      context[v] = bit === 1;
    });

    const rowValues: Record<string, boolean> = {};
    
    // Evaluate
    finalColumns.forEach(col => {
       if (col.isInput) {
         rowValues[col.expression] = context[col.expression];
       } else {
         const node = subExprNodes.find(n => n.id === col.astId);
         if (node) {
             rowValues[col.expression] = evaluateAST(node, context);
         } else if (col.isOutput) {
             rowValues[col.expression] = evaluateAST(ast, context);
         }
       }
    });

    const finalResult = rowValues[ast.expression];
    if (finalResult) contradiction = false;
    else tautology = false;

    rows.push({
      id: `row-${i}`,
      index: i,
      values: rowValues
    });
  }

  let classification: Classification = 'Contingency';
  if (tautology) classification = 'Tautology';
  if (contradiction) classification = 'Contradiction';
  
  const forms = generateImplicationForms(ast);

  // Generate K-Map if applicable
  const kMapData = generateKMap(declaredVariables, rows);

  return {
    ast,
    columns: finalColumns,
    rows,
    variables: declaredVariables,
    classification,
    mainConnective: ast.type,
    implicationForms: forms ? {
        original: formatLabel(forms.original, settings),
        converse: formatLabel(forms.converse, settings),
        inverse: formatLabel(forms.inverse, settings),
        contrapositive: formatLabel(forms.contrapositive, settings)
    } : undefined,
    kMapData
  };
};

export const reanalyzeFromRows = (
    current: AnalysisResult,
    updatedRows: TruthTableRow[],
    settings: AppSettings
): AnalysisResult => {
    // 1. Re-classify
    let tautology = true;
    let contradiction = true;
    const resultExpr = current.ast.expression;

    updatedRows.forEach(row => {
        const val = row.values[resultExpr];
        if (val) contradiction = false;
        else tautology = false;
    });

    let classification: Classification = 'Contingency';
    if (tautology) classification = 'Tautology';
    if (contradiction) classification = 'Contradiction';

    // 2. Re-generate K-Map based on updated rows
    const kMapData = generateKMap(current.variables, updatedRows);

    return {
        ...current,
        rows: updatedRows,
        classification,
        kMapData
    };
};

// --- Implication Form Helper ---
const generateImplicationForms = (node: ASTNode): ImplicationForms | undefined => {
  if (node.type !== 'IMPLIES' || !node.left || !node.right) return undefined;
  
  const P = node.left.expression;
  const Q = node.right.expression;
  
  const clean = (s: string) => {
    if (s.startsWith('(') && s.endsWith(')')) return s.slice(1, -1);
    return s;
  }

  const pClean = clean(P);
  const qClean = clean(Q);

  return {
    original: `${P} → ${Q}`,
    converse: `${Q} → ${P}`,
    inverse: `¬(${pClean}) → ¬(${qClean})`,
    contrapositive: `¬(${qClean}) → ¬(${pClean})`
  };
};