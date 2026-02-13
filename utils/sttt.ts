
import { ASTNode, STTTBranch, STTTReport, STTTStep, AssignmentMap, STTTProofType } from '../types';

/**
 * Shortened Truth Table Technique (STTT) Engine V6.5
 * 
 * Supports:
 * - Tautology (Assume F)
 * - Contradiction/Absurdity (Assume T)
 * - Tautological Implication (Argument Validity): P -> Q (Assume P=T, Q=F)
 * - Tautological Equivalence: P <-> Q (Assume F, requires double branching)
 * - Contingency (Check both Tautology and Contradiction)
 */

interface ProcessingNode {
    ast: ASTNode;
    targetValue: boolean;
}

export const generateSTTTReport = (ast: ASTNode, variables: string[], target: STTTProofType = 'Tautology'): STTTReport => {
    
    // Special Handling for Contingency: It requires checking TWO conditions.
    if (target === 'Contingency') {
        return generateContingencyReport(ast, variables);
    }

    // 1. Initial Assumption Logic based on Target Type
    let rootQueue: ProcessingNode[] = [];
    let initialAssumptions: { expr: string, val: boolean }[] = [];
    let proofTitle = '';

    if (target === 'Tautology') {
        rootQueue = [{ ast, targetValue: false }];
        initialAssumptions = [{ expr: ast.expression, val: false }];
        proofTitle = "Prove Tautology";
    } else if (target === 'Contradiction') {
        rootQueue = [{ ast, targetValue: true }];
        initialAssumptions = [{ expr: ast.expression, val: true }];
        proofTitle = "Prove Absurdity (Contradiction)";
    } else if (target === 'Implication') {
        // Only valid if AST is IMPLIES
        if (ast.type === 'IMPLIES' && ast.left && ast.right) {
            // To disprove P->Q, assume P=T, Q=F
            rootQueue = [
                { ast: ast.left, targetValue: true },
                { ast: ast.right, targetValue: false }
            ];
            initialAssumptions = [
                { expr: ast.left.expression, val: true },
                { expr: ast.right.expression, val: false }
            ];
            proofTitle = "Prove Argument Validity (T.I.)";
        } else {
             // Fallback
             rootQueue = [{ ast, targetValue: false }];
             target = 'Tautology'; 
             proofTitle = "Prove Tautology (Fallback)";
        }
    } else if (target === 'Equivalence') {
        // Only valid if AST is IFF
        if (ast.type === 'IFF' && ast.left && ast.right) {
             return generateEquivalenceReport(ast, variables);
        } else {
            rootQueue = [{ ast, targetValue: false }];
            target = 'Tautology';
            proofTitle = "Prove Tautology (Fallback)";
        }
    }

    // 2. Initialize Root
    const rootBranch: STTTBranch = {
        id: 'root',
        steps: [],
        assignments: {},
        status: 'Open',
        children: []
    };

    // 3. Solve
    const resultBranch = solveBranch(rootBranch, rootQueue, variables);

    // 4. Result
    const isProven = checkBranchClosure(resultBranch);
    let counterExample: AssignmentMap | undefined = undefined;
    if (!isProven) {
        counterExample = findCounterExample(resultBranch, variables);
    }

    const textSummary = isProven 
            ? `All branches led to contradictions. The statement IS a ${target}.` 
            : `Found a consistent assignment (Counter-example). The statement is NOT a ${target}.`;

    return {
        target,
        rootBranch: resultBranch,
        result: isProven ? 'Proven' : 'Disproven',
        counterExample,
        textSummary,
        proofTitle,
        initialAssumptions
    };
};

const generateContingencyReport = (ast: ASTNode, variables: string[]): STTTReport => {
    // Strategy:
    // 1. Try to prove Tautology (Assume False). 
    //    If PROVEN (contradiction found), then it is ALWAYS TRUE. So NOT Contingency.
    // 2. Try to prove Contradiction (Assume True).
    //    If PROVEN (contradiction found), then it is ALWAYS FALSE. So NOT Contingency.
    // 3. If BOTH are DISPROVEN (counter-examples found for both), then it IS Contingency.

    const tReport = generateSTTTReport(ast, variables, 'Tautology');
    if (tReport.result === 'Proven') {
        return {
            target: 'Contingency',
            rootBranch: tReport.rootBranch,
            result: 'Disproven',
            textSummary: "The statement is a Tautology (Always True), therefore it is NOT a Contingency.",
            proofTitle: "Check Contingency",
            initialAssumptions: [{ expr: ast.expression, val: false }]
        };
    }

    const cReport = generateSTTTReport(ast, variables, 'Contradiction');
    if (cReport.result === 'Proven') {
        return {
            target: 'Contingency',
            rootBranch: cReport.rootBranch,
            result: 'Disproven',
            textSummary: "The statement is a Contradiction (Always False), therefore it is NOT a Contingency.",
            proofTitle: "Check Contingency",
            initialAssumptions: [{ expr: ast.expression, val: true }]
        };
    }

    // Both disproven. We found a case where it's False (tReport counter-example) and True (cReport counter-example).
    // Visualization: We can show one of the trees that successfully found a value. 
    // Or we can construct a dummy root showing both results?
    // For simplicity, let's show the Tautology attempt (showing it can be False) and mention the other.
    
    return {
        target: 'Contingency',
        rootBranch: tReport.rootBranch,
        result: 'Proven',
        textSummary: "Found cases for both True and False values. The statement IS a Contingency.",
        proofTitle: "Check Contingency",
        initialAssumptions: [{ expr: ast.expression, val: false }] // We show the check for False first
    };
};

const generateEquivalenceReport = (ast: ASTNode, variables: string[]): STTTReport => {
    if (!ast.left || !ast.right) throw new Error("Invalid Equivalence");
    
    // Create a dummy root that splits immediately
    const rootBranch: STTTBranch = {
        id: 'root',
        steps: [{
            id: 'init-split',
            description: "To disprove Equivalence, we test both cases where sides differ.",
            targetNodeExpression: ast.expression,
            value: false,
            reason: 'Assumption'
        }],
        assignments: {},
        status: 'Open',
        children: []
    };

    // Case 1: L=T, R=F
    const branch1 = solveBranch(
        createChildBranch(rootBranch, `${ast.left.expression}=T, ${ast.right.expression}=F`),
        [{ ast: ast.left, targetValue: true }, { ast: ast.right, targetValue: false }],
        variables
    );

    // Case 2: L=F, R=T
    const branch2 = solveBranch(
        createChildBranch(rootBranch, `${ast.left.expression}=F, ${ast.right.expression}=T`),
        [{ ast: ast.left, targetValue: false }, { ast: ast.right, targetValue: true }],
        variables
    );

    rootBranch.children = [branch1, branch2];
    
    const isProven = checkBranchClosure(rootBranch);
    
    return {
        target: 'Equivalence',
        rootBranch,
        result: isProven ? 'Proven' : 'Disproven',
        textSummary: isProven 
            ? "Both scenarios of differing values led to contradictions. Therefore, LHS ⇔ RHS." 
            : "Found a case where LHS ≠ RHS. Therefore, they are NOT equivalent.",
        proofTitle: "Prove Tautological Equivalence",
        initialAssumptions: [{ expr: ast.expression, val: false }]
    };
};


const checkBranchClosure = (branch: STTTBranch): boolean => {
    if (branch.status === 'Closed') return true;
    if (branch.status === 'Complete') return false;
    if (branch.children && branch.children.length > 0) {
        return branch.children.every(checkBranchClosure);
    }
    return false;
};

const findCounterExample = (branch: STTTBranch, allVars: string[]): AssignmentMap | undefined => {
    if (branch.status === 'Complete') {
        return branch.assignments;
    }
    if (branch.children) {
        for (const child of branch.children) {
            const found = findCounterExample(child, allVars);
            if (found) return found;
        }
    }
    return undefined;
};

// --- The Core Recursive Solver ---

const solveBranch = (
    branch: STTTBranch, 
    todoQueue: ProcessingNode[], 
    allVars: string[]
): STTTBranch => {
    
    let currentQueue = [...todoQueue];
    
    while (currentQueue.length > 0) {
        const { ast, targetValue } = currentQueue.shift()!;
        
        // 1. Check for Contradiction with existing assignments
        if (branch.assignments[ast.id] !== undefined) {
            if (branch.assignments[ast.id] !== targetValue) {
                // Contradiction found!
                branch.status = 'Closed';
                branch.contradiction = {
                    variable: ast.expression,
                    val1: branch.assignments[ast.id],
                    val2: targetValue
                };
                branch.steps.push({
                    id: crypto.randomUUID(),
                    description: `Contradiction! ${ast.expression} was ${branch.assignments[ast.id] ? 'True' : 'False'}, but now forced to ${targetValue ? 'True' : 'False'}.`,
                    targetNodeExpression: ast.expression,
                    value: targetValue,
                    reason: 'Forced'
                });
                return branch;
            }
            continue; // Already assigned same value, skip
        }

        // 2. Assign Value
        branch.assignments[ast.id] = targetValue;
        
        // Log Step
        if (branch.steps.length > 0 || branch.id !== 'root') {
             branch.steps.push({
                id: crypto.randomUUID(),
                description: `Force ${ast.expression} = ${targetValue ? 'True' : 'False'}`,
                targetNodeExpression: ast.expression,
                value: targetValue,
                reason: 'Forced'
            });
        }

        // 3. Propagate Logic (Determine Children Values)
        const nextMoves = getImplications(ast, targetValue);

        if (nextMoves.type === 'Deterministic') {
            // Add children to queue
            currentQueue.push(...nextMoves.nodes);
        } else if (nextMoves.type === 'Branching') {
            // SPLIT!
            branch.steps.push({
                id: crypto.randomUUID(),
                description: `Branching required for ${ast.expression} = ${targetValue ? 'True' : 'False'}`,
                targetNodeExpression: ast.expression,
                value: targetValue,
                reason: 'Branch'
            });

            // Create Child Branches
            const branchA = solveBranch(
                createChildBranch(branch, 'Case 1'),
                [...currentQueue, ...nextMoves.branches[0]], 
                allVars
            );

            const branchB = solveBranch(
                createChildBranch(branch, 'Case 2'),
                [...currentQueue, ...nextMoves.branches[1]],
                allVars
            );

            branch.children = [branchA, branchB];
            
            // Determine Branch Status based on children
            if (branchA.status === 'Closed' && branchB.status === 'Closed') {
                branch.status = 'Closed'; // All paths contradict
            } else {
                branch.status = 'Complete'; // At least one path works
            }
            return branch;
        }
    }

    // If queue empty and no contradiction:
    branch.status = 'Complete';
    return branch;
};

const createChildBranch = (parent: STTTBranch, label: string): STTTBranch => ({
    id: crypto.randomUUID(),
    parentId: parent.id,
    steps: [{ 
        id: crypto.randomUUID(), 
        description: `Subcase: ${label}`, 
        targetNodeExpression: 'Branch', 
        value: false, 
        reason: 'Branch' 
    }],
    assignments: { ...parent.assignments }, // Copy assignments
    status: 'Open',
    children: []
});

type ImplicationResult = 
  | { type: 'Deterministic', nodes: ProcessingNode[] }
  | { type: 'Branching', branches: [ProcessingNode[], ProcessingNode[]] };

const getImplications = (node: ASTNode, val: boolean): ImplicationResult => {
    const T = true;
    const F = false;

    // Base Case
    if (node.type === 'VAR') return { type: 'Deterministic', nodes: [] };

    // NOT (¬A)
    if (node.type === 'NOT' && node.operand) {
        return { type: 'Deterministic', nodes: [{ ast: node.operand, targetValue: !val }] };
    }

    if (!node.left || !node.right) return { type: 'Deterministic', nodes: [] }; 

    const L = node.left;
    const R = node.right;

    switch (node.type) {
        case 'AND':
            if (val === T) {
                // T = T ∧ T (Deterministic)
                return { type: 'Deterministic', nodes: [{ ast: L, targetValue: T }, { ast: R, targetValue: T }] };
            } else {
                // F = F ∧ ? OR ? ∧ F (Branching)
                return { type: 'Branching', branches: [ [{ ast: L, targetValue: F }], [{ ast: R, targetValue: F }] ] };
            }
        
        case 'OR':
            if (val === F) {
                // F = F ∨ F (Deterministic)
                return { type: 'Deterministic', nodes: [{ ast: L, targetValue: F }, { ast: R, targetValue: F }] };
            } else {
                // T = T ∨ ? OR ? ∨ T (Branching)
                return { type: 'Branching', branches: [ [{ ast: L, targetValue: T }], [{ ast: R, targetValue: T }] ] };
            }

        case 'IMPLIES':
            if (val === F) {
                // F = T → F (Deterministic - The "Golden Rule" of STTT)
                return { type: 'Deterministic', nodes: [{ ast: L, targetValue: T }, { ast: R, targetValue: F }] };
            } else {
                // T = F → ? OR ? → T (Branching)
                return { type: 'Branching', branches: [ [{ ast: L, targetValue: F }], [{ ast: R, targetValue: T }] ] };
            }
            
        case 'IFF': // Equivalence
             if (val === T) {
                 // Case 1: T <-> T, Case 2: F <-> F
                 return { type: 'Branching', branches: [ 
                     [{ ast: L, targetValue: T }, { ast: R, targetValue: T }],
                     [{ ast: L, targetValue: F }, { ast: R, targetValue: F }]
                 ] };
             } else {
                 // Case 1: T <-> F, Case 2: F <-> T
                 return { type: 'Branching', branches: [ 
                     [{ ast: L, targetValue: T }, { ast: R, targetValue: F }],
                     [{ ast: L, targetValue: F }, { ast: R, targetValue: T }]
                 ] };
             }
             
        case 'XOR':
             if (val === F) { 
                 return { type: 'Branching', branches: [ 
                     [{ ast: L, targetValue: T }, { ast: R, targetValue: T }],
                     [{ ast: L, targetValue: F }, { ast: R, targetValue: F }]
                 ] };
             } else { 
                 return { type: 'Branching', branches: [ 
                     [{ ast: L, targetValue: T }, { ast: R, targetValue: F }],
                     [{ ast: L, targetValue: F }, { ast: R, targetValue: T }]
                 ] };
             }
    }
    
    return { type: 'Deterministic', nodes: [] };
};
