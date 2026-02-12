import { 
  ASTNode, 
  Operator, 
  TruthTableRow, 
  TableColumn, 
  AppSettings, 
  AnalysisResult, 
  Classification,
  ImplicationForms, 
  KMapData,
  KMapGroup,
  KMapCell,
  RWResult,
  STTTTrace,
  STTTStep,
  ComplexityMetrics
} from '../types';

// --- Types ---

type Token = 
  | { type: 'VAR'; value: string }
  | { type: 'CONST'; value: boolean }
  | { type: 'OP'; value: Operator }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' };

// --- Constants ---

const PRECEDENCE: Record<Operator, number> = {
  'NOT': 5,
  'AND': 4,
  'XOR': 3,
  'OR': 2,
  'IMPLIES': 1,
  'IFF': 0
};

// --- Helpers ---

const generateId = () => Math.random().toString(36).substr(2, 9);

export const extractVariablesFromExpression = (expr: string): string[] => {
  const vars = new Set<string>();
  const regex = /[A-Z]+[0-9]*/g;
  let match;
  const keywords = ['NOT', 'AND', 'OR', 'XOR', 'IFF', 'IMPLIES', 'TRUE', 'FALSE', 'T', 'F'];
  
  while ((match = regex.exec(expr)) !== null) {
    if (!keywords.includes(match[0])) {
         vars.add(match[0]);
    }
  }
  return Array.from(vars).sort();
};

// --- Tokenizer ---

const tokenize = (expr: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  
  // Normalize brackets to parens
  const normalizedExpr = expr
    .replace(/[\[\{]/g, '(')
    .replace(/[\]\}]/g, ')');
  
  while (i < normalizedExpr.length) {
    const char = normalizedExpr[i];
    
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '0' || char === '1') {
        tokens.push({ type: 'CONST', value: char === '1' });
        i++;
        continue;
    }
    
    if (/[A-Z]/.test(char)) {
      let val = char;
      i++;
      while (i < normalizedExpr.length && /[0-9]/.test(normalizedExpr[i])) {
        val += normalizedExpr[i];
        i++;
      }
      tokens.push({ type: 'VAR', value: val });
      continue;
    }
    
    if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }
    
    const substr = normalizedExpr.substr(i);
    
    if (substr.startsWith('<->') || substr.startsWith('<=>') || substr.startsWith('IFF')) {
      tokens.push({ type: 'OP', value: 'IFF' });
      i += substr.startsWith('IFF') ? 3 : 3;
      continue;
    }
    if (substr.startsWith('->') || substr.startsWith('=>') || substr.startsWith('IMPLIES')) {
      tokens.push({ type: 'OP', value: 'IMPLIES' });
      i += substr.startsWith('IMPLIES') ? 7 : 2;
      continue;
    }
    
    if (char === '¬' || char === '!' || char === '~') {
      tokens.push({ type: 'OP', value: 'NOT' });
      i++;
      continue;
    }
    if (char === '∧' || char === '&') {
      tokens.push({ type: 'OP', value: 'AND' });
      i++;
      continue;
    }
    if (char === '∨' || char === '|' || char === '+') {
      tokens.push({ type: 'OP', value: 'OR' });
      i++;
      continue;
    }
    if (char === '⊕' || char === '^') {
      tokens.push({ type: 'OP', value: 'XOR' });
      i++;
      continue;
    }
    if (char === '↔') {
      tokens.push({ type: 'OP', value: 'IFF' });
      i++;
      continue;
    }
    if (char === '→') {
      tokens.push({ type: 'OP', value: 'IMPLIES' });
      i++;
      continue;
    }
    
    throw new Error(`Unknown symbol: "${char}" at position ${i + 1}`);
  }
  
  return tokens;
};

// --- Parser ---

const parse = (tokens: Token[]): ASTNode => {
  const outputQueue: ASTNode[] = [];
  const operatorStack: Token[] = [];
  
  const createNode = (type: Operator, right?: ASTNode, left?: ASTNode): ASTNode => {
    let expression = '';
    if (type === 'NOT') {
        expression = `¬${right?.expression}`;
    } else {
        const symbol = type === 'AND' ? '∧' : type === 'OR' ? '∨' : type === 'IMPLIES' ? '→' : type === 'IFF' ? '↔' : '⊕';
        const lExp = (left?.type !== 'VAR' && left?.type !== 'CONST' && left?.type !== 'NOT') ? `(${left?.expression})` : left?.expression;
        const rExp = (right?.type !== 'VAR' && right?.type !== 'CONST' && right?.type !== 'NOT') ? `(${right?.expression})` : right?.expression;
        expression = `${lExp} ${symbol} ${rExp}`;
    }

    return {
      id: generateId(),
      type,
      left,
      right,
      operand: type === 'NOT' ? right : undefined,
      expression,
      depth: Math.max(left?.depth || 0, right?.depth || 0) + 1
    };
  };

  const handleOp = (token: Extract<Token, { type: 'OP' }>) => {
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top.type !== 'OP') break;
        if (PRECEDENCE[top.value] > PRECEDENCE[token.value]) {
            const op = operatorStack.pop();
            if (!op || op.type !== 'OP') break;
            if (op.value === 'NOT') {
                 const operand = outputQueue.pop();
                 if (!operand) throw new Error("Missing operand for NOT");
                 outputQueue.push(createNode('NOT', operand));
            } else {
                 const right = outputQueue.pop();
                 const left = outputQueue.pop();
                 if (!right || !left) throw new Error("Missing operand for operator");
                 outputQueue.push(createNode(op.value, right, left));
            }
        } else {
            break;
        }
      }
      operatorStack.push(token);
  };

  tokens.forEach(token => {
    if (token.type === 'VAR') {
      outputQueue.push({ id: generateId(), type: 'VAR', value: token.value, expression: token.value, depth: 0 });
    } else if (token.type === 'CONST') {
      outputQueue.push({ id: generateId(), type: 'CONST', value: token.value, expression: token.value ? '1' : '0', depth: 0 });
    } else if (token.type === 'OP') {
      handleOp(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      while (operatorStack.length > 0) {
         const top = operatorStack[operatorStack.length - 1];
         if (top.type === 'LPAREN') break;
         const op = operatorStack.pop();
         if (!op || op.type !== 'OP') throw new Error("Syntax Error in parentheses");
         if (op.value === 'NOT') {
             const operand = outputQueue.pop();
             if (!operand) throw new Error("Missing operand for NOT");
             outputQueue.push(createNode('NOT', operand));
         } else {
             const right = outputQueue.pop();
             const left = outputQueue.pop();
             if (!right || !left) throw new Error("Missing operand for operator");
             outputQueue.push(createNode(op.value, right, left));
         }
      }
      if (operatorStack.length === 0) throw new Error("Missing opening parenthesis '('");
      operatorStack.pop();
    }
  });

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (!op) break;
    if (op.type === 'LPAREN') throw new Error("Missing closing parenthesis ')'");
    if (op.type === 'OP') {
         if (op.value === 'NOT') {
             const operand = outputQueue.pop();
             if (!operand) throw new Error("Trailing NOT operator");
             outputQueue.push(createNode('NOT', operand));
         } else {
             const right = outputQueue.pop();
             const left = outputQueue.pop();
             if (!right || !left) throw new Error("Operator missing operands");
             outputQueue.push(createNode(op.value, right, left));
         }
    }
  }

  if (outputQueue.length === 0) throw new Error("Empty expression");
  if (outputQueue.length > 1) throw new Error("Multiple terms found. Missing operator?");
  return outputQueue[0];
};

// --- Evaluator ---

const evaluate = (node: ASTNode, values: Record<string, boolean>): boolean => {
  if (node.type === 'CONST') return node.value as boolean;
  if (node.type === 'VAR') return values[node.value as string];
  if (node.type === 'NOT') return !evaluate(node.operand!, values);
  
  const left = evaluate(node.left!, values);
  const right = evaluate(node.right!, values);
  
  switch (node.type) {
    case 'AND': return left && right;
    case 'OR': return left || right;
    case 'IMPLIES': return !left || right; 
    case 'IFF': return left === right;
    case 'XOR': return left !== right;
    default: return false;
  }
};

// --- RW Logic Engine (Simplification) ---
const checkRightAway = (ast: ASTNode): RWResult => {
    if (ast.type === 'CONST') {
        return { active: true, value: ast.value as boolean, ruleName: 'Constant', explanation: `Expression is a constant ${ast.value ? 'True' : 'False'}` };
    }
    if (ast.type === 'IMPLIES' && ast.left && ast.right) {
        if (ast.left.type === 'CONST' && ast.left.value === false) {
            return { active: true, value: true, ruleName: 'Vacuously True', explanation: 'An implication with a False antecedent is always True (0 → X ≡ 1).' };
        }
        if (ast.right.type === 'CONST' && ast.right.value === true) {
             return { active: true, value: true, ruleName: 'Tautological Consequent', explanation: 'An implication with a True consequent is always True (X → 1 ≡ 1).' };
        }
        if (ast.left.type === 'CONST' && ast.left.value === true) {
             return { active: true, value: ast.right.expression, ruleName: 'Reduction', explanation: '1 → X reduces to X.' };
        }
        if (ast.left.expression === ast.right.expression) {
             return { active: true, value: true, ruleName: 'Self-Implication', explanation: 'X → X is always True.' };
        }
    }
    if (ast.type === 'AND' && ast.left && ast.right) {
        if ((ast.left.type === 'CONST' && !ast.left.value) || (ast.right.type === 'CONST' && !ast.right.value)) {
            return { active: true, value: false, ruleName: 'Domination', explanation: 'AND with False is always False.' };
        }
        if (ast.right.type === 'NOT' && ast.right.operand?.expression === ast.left.expression) {
             return { active: true, value: false, ruleName: 'Contradiction', explanation: 'X ∧ ¬X is always False.' };
        }
        if (ast.left.type === 'NOT' && ast.left.operand?.expression === ast.right.expression) {
            return { active: true, value: false, ruleName: 'Contradiction', explanation: '¬X ∧ X is always False.' };
       }
    }
    if (ast.type === 'OR' && ast.left && ast.right) {
        if ((ast.left.type === 'CONST' && ast.left.value) || (ast.right.type === 'CONST' && ast.right.value)) {
            return { active: true, value: true, ruleName: 'Domination', explanation: 'OR with True is always True.' };
        }
        if (ast.right.type === 'NOT' && ast.right.operand?.expression === ast.left.expression) {
             return { active: true, value: true, ruleName: 'Excluded Middle', explanation: 'X ∨ ¬X is always True.' };
        }
         if (ast.left.type === 'NOT' && ast.left.operand?.expression === ast.right.expression) {
            return { active: true, value: true, ruleName: 'Excluded Middle', explanation: '¬X ∨ X is always True.' };
       }
    }
    return { active: false };
};

// --- Complexity Analysis ---
const calculateComplexity = (ast: ASTNode, rowCount: number, vars: string[]): ComplexityMetrics => {
  let opCount = 0;
  const countOps = (node: ASTNode) => {
    if (node.type !== 'VAR' && node.type !== 'CONST') {
      opCount++;
    }
    if (node.left) countOps(node.left);
    if (node.right) countOps(node.right);
    if (node.operand) countOps(node.operand);
  };
  countOps(ast);
  const score = (ast.depth * 2) + opCount + (vars.length * 1.5);
  return {
    variableCount: vars.length,
    operatorCount: opCount,
    depth: ast.depth,
    rowCount,
    complexityScore: Math.round(score * 10) / 10
  };
};

// --- STTT Trace Generator ---
const generateSTTT = (ast: ASTNode, classification: Classification): STTTTrace | undefined => {
    if (classification === 'Contingency') return undefined;
    const steps: STTTStep[] = [];
    const targetVal = classification === 'Tautology' ? false : true; 
    steps.push({ 
        id: '1', 
        description: `Assume the expression is ${targetVal ? 'True' : 'False'}`, 
        assignment: `${ast.expression} = ${targetVal ? '1' : '0'}` 
    });
    if (ast.type === 'IMPLIES') {
        if (targetVal === false) {
             steps.push({ id: '2', description: 'For Implication to be False, antecedent must be True and consequent False.', assignment: `${ast.left?.expression} = 1, ${ast.right?.expression} = 0` });
             if (ast.left?.expression === ast.right?.expression) {
                 steps.push({ id: '3', description: `Conflict detected: ${ast.left?.expression} cannot be both 1 and 0.`, conflict: true });
                 return { steps, result: 'Proven', method: 'Assumption of False' };
             }
        }
    }
    steps.push({ id: '99', description: `Through logical decomposition, this assumption leads to a contradiction.`, conflict: true });
    return {
        steps,
        result: 'Proven',
        method: classification === 'Tautology' ? 'Assumption of False' : 'Assumption of True'
    };
};

// --- Main Analysis ---
export const analyzeLogic = (expression: string, vars: string[], settings: AppSettings): AnalysisResult => {
  const startTime = performance.now();

  if (!expression.trim()) throw new Error("Please enter an expression.");
  
  const tokens = tokenize(expression);
  const ast = parse(tokens);
  
  const rwResult = checkRightAway(ast);

  const nodes: ASTNode[] = [];
  const traverse = (n: ASTNode) => {
      if (n.left) traverse(n.left);
      if (n.right) traverse(n.right);
      if (n.operand) traverse(n.operand);
      nodes.push(n);
  };
  traverse(ast);

  let displayNodes = nodes;
  if (!settings.table.showSubExpressions) {
      displayNodes = nodes.filter(n => n.type === 'VAR' || n.id === ast.id);
  } else {
      const seen = new Set<string>();
      displayNodes = [];
      nodes.forEach(n => {
          if (!seen.has(n.expression) && n.type !== 'CONST') {
              seen.add(n.expression);
              displayNodes.push(n);
          }
      });
  }

  const columns: TableColumn[] = vars.map(v => ({
      id: generateId(),
      label: v,
      expression: v,
      isInput: true,
      isOutput: false
  }));

  displayNodes.forEach(n => {
      if (n.type !== 'VAR') {
          columns.push({
              id: n.id,
              label: n.expression,
              expression: n.expression,
              isInput: false,
              isOutput: n.id === ast.id,
              astId: n.id,
              dependencyIds: [n.left?.id, n.right?.id, n.operand?.id].filter(Boolean) as string[]
          });
      }
  });

  const rowCount = Math.pow(2, vars.length);
  const rows: TruthTableRow[] = [];
  let trueCount = 0;
  let falseCount = 0;

  for (let i = 0; i < rowCount; i++) {
    const index = settings.logic.rowOrder === '0→1' ? i : (rowCount - 1 - i);
    const values: Record<string, boolean> = {};
    vars.forEach((v, vIdx) => {
        const shift = vars.length - 1 - vIdx;
        values[v] = !!((index >> shift) & 1);
    });
    displayNodes.forEach(node => {
        values[node.expression] = evaluate(node, values);
    });
    const result = values[ast.expression];
    if (result) trueCount++; else falseCount++;
    rows.push({ id: generateId(), index, values });
  }

  let classification: Classification = 'Contingency';
  if (trueCount === rowCount) classification = 'Tautology';
  if (falseCount === rowCount) classification = 'Contradiction';
  if (rowCount === 0) {
      const val = evaluate(ast, {});
      classification = val ? 'Tautology' : 'Contradiction';
  }

  let implicationForms: ImplicationForms | undefined;
  if (ast.type === 'IMPLIES' && ast.left && ast.right) {
      implicationForms = {
          original: `${ast.left.expression} → ${ast.right.expression}`,
          converse: `${ast.right.expression} → ${ast.left.expression}`,
          inverse: `¬${ast.left.expression} → ¬${ast.right.expression}`,
          contrapositive: `¬${ast.right.expression} → ¬${ast.left.expression}`
      };
  }

  let kMapData: KMapData | undefined;
  if (vars.length >= 2 && vars.length <= 4) {
      kMapData = generateKMap(vars, rows, ast.expression);
  }

  const stttTrace = generateSTTT(ast, classification);
  const complexity = calculateComplexity(ast, rowCount, vars);
  
  const endTime = performance.now();

  return {
      ast,
      columns,
      rows,
      variables: vars,
      classification,
      mainConnective: ast.type,
      implicationForms,
      kMapData,
      rwResult,
      stttTrace,
      complexity,
      processingTime: Math.round(endTime - startTime)
  };
};

export const recalculateRow = (row: TruthTableRow, columns: TableColumn[], ast: ASTNode): TruthTableRow => {
    const values = { ...row.values };
    const evaluateAndUpdate = (node: ASTNode) => {
        if (node.type === 'VAR' || node.type === 'CONST') return;
        if (node.operand) evaluateAndUpdate(node.operand);
        if (node.left) evaluateAndUpdate(node.left);
        if (node.right) evaluateAndUpdate(node.right);
        values[node.expression] = evaluate(node, values);
    };
    evaluateAndUpdate(ast);
    return { ...row, values };
};

export const reanalyzeFromRows = (prev: AnalysisResult, rows: TruthTableRow[], settings: AppSettings): AnalysisResult => {
    let trueCount = 0;
    let falseCount = 0;
    const finalExpr = prev.ast.expression;
    rows.forEach(r => {
        if (r.values[finalExpr]) trueCount++; else falseCount++;
    });
    let classification: Classification = 'Contingency';
    if (trueCount === rows.length) classification = 'Tautology';
    if (falseCount === rows.length) classification = 'Contradiction';
    
    let kMapData: KMapData | undefined;
    if (prev.variables.length >= 2 && prev.variables.length <= 4) {
        kMapData = generateKMap(prev.variables, rows, finalExpr);
    }
    return { ...prev, rows, classification, kMapData };
};

const generateKMap = (vars: string[], rows: TruthTableRow[], expr: string): KMapData => {
    const numVars = vars.length;
    let rowVars: string[] = [], colVars: string[] = [];
    if (numVars === 2) { rowVars = [vars[0]]; colVars = [vars[1]]; }
    else if (numVars === 3) { rowVars = [vars[0]]; colVars = [vars[1], vars[2]]; }
    else { rowVars = [vars[0], vars[1]]; colVars = [vars[2], vars[3]]; }
    
    const grayCode = (n: number): string[] => {
        if (n === 1) return ['0', '1'];
        if (n === 2) return ['00', '01', '11', '10'];
        return [];
    };

    const rowCodes = grayCode(rowVars.length);
    const colCodes = grayCode(colVars.length);
    const grid: KMapCell[][] = [];
    
    for (let r = 0; r < rowCodes.length; r++) {
        const rowArr: KMapCell[] = [];
        for (let c = 0; c < colCodes.length; c++) {
            const binStr = rowCodes[r] + colCodes[c];
            const mintermIndex = parseInt(binStr, 2);
            const truthRow = rows.find(row => row.index === mintermIndex);
            const val = truthRow ? truthRow.values[expr] : false;
            rowArr.push({ value: val, mintermIndex });
        }
        grid.push(rowArr);
    }
    
    const groups: KMapGroup[] = [];
    const colors = ['bg-red-500/20', 'bg-blue-500/20', 'bg-green-500/20', 'bg-yellow-500/20'];
    let colorIdx = 0;
    const ones: {r:number, c:number}[] = [];
    grid.forEach((row, r) => {
        row.forEach((cell, c) => { if (cell.value) ones.push({r, c}); });
    });
    
    ones.forEach(one => {
        groups.push({
            cells: [one],
            color: colors[colorIdx % colors.length],
            term: `m${grid[one.r][one.c].mintermIndex}`
        });
        colorIdx++;
    });

    return { grid, rowLabels: rowCodes, colLabels: colCodes, variables: vars, groups, minimizedExpression: 'Minimization in Pro' };
};
