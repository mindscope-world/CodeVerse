
export const runPythonCode = (code: string): string[] => {
  const lines = code.split('\n');
  const output: string[] = [];
  const variables: Record<string, any> = {};
  let steps = 0;
  const MAX_STEPS = 2000;

  // Helper to evaluate simple expressions (literals, variables)
  function evaluate(expr: string): any {
    expr = expr.trim();
    // Number
    if (!isNaN(Number(expr))) return Number(expr);
    // String
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }
    // Variable
    if (variables.hasOwnProperty(expr)) return variables[expr];
    
    return expr; 
  }

  // Recursive block executor
  // Returns the index of the next line to process after the block
  function executeBlock(startIdx: number, minIndent: number): number {
    let i = startIdx;
    
    while (i < lines.length) {
      if (steps++ > MAX_STEPS) throw new Error("Infinite loop detected (max steps reached)");

      const rawLine = lines[i];
      // Skip empty lines or comments
      if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) {
        i++;
        continue;
      }

      const indent = rawLine.search(/\S/);
      if (indent < minIndent) {
        return i; // End of this block scope
      }

      const line = rawLine.trim();

      try {
        // 1. Assignment (x = 5)
        if (line.match(/^[\w_]+\s*=/)) {
          const parts = line.split('=');
          const name = parts[0].trim();
          const val = evaluate(parts[1].trim());
          variables[name] = val;
        }
        // 2. Compound Assignment (x += 1)
        else if (line.match(/^[\w_]+\s*\+=/)) {
           const parts = line.split('+=');
           const name = parts[0].trim();
           const val = evaluate(parts[1].trim());
           if (variables[name] === undefined) variables[name] = 0;
           variables[name] += val;
        }
        // 3. Print
        else if (line.startsWith('print(')) {
           const content = line.slice(6, -1); // remove print( and )
           // Handle simple concatenation like print("Val: ", val) if comma exists
           if (content.includes(',')) {
               const parts = content.split(',').map(p => evaluate(p.trim()));
               output.push(`> ${parts.join(' ')}`);
           } else {
               output.push(`> ${evaluate(content)}`);
           }
        }
        // 4. Sleep/Wait (Mock)
        else if (line.startsWith('time.sleep') || line.startsWith('avatar.move')) {
             output.push(`> Executing: ${line}`);
        }
        // 5. For Loop
        else if (line.startsWith('for ')) {
           // for i in range(x):
           const match = line.match(/range\((.+)\):/);
           if (match) {
             const count = Number(evaluate(match[1]));
             const blockStart = i + 1;
             let blockEnd = blockStart;
             
             // Find block end first to know where to jump after loop
             // We do a dummy scan
             let j = blockStart;
             while(j < lines.length) {
                if (lines[j].trim() !== '' && lines[j].search(/\S/) <= indent) break;
                j++;
             }
             blockEnd = j;

             // Execute loop
             for(let k=0; k<count; k++) {
                // Check if loop limit exceeded
                if (steps > MAX_STEPS) throw new Error("Infinite loop detected");
                executeBlock(blockStart, indent + 4);
             }
             
             i = blockEnd;
             continue; // Skip the standard i++ since we handled the block
           }
        }
        // 6. If Statement
        else if (line.startsWith('if ')) {
           // if var > val:
           const match = line.match(/if\s+(\w+)\s*([><=!]+)\s*(.+):/);
           if (match) {
              const lhs = evaluate(match[1]);
              const op = match[2];
              const rhs = evaluate(match[3]);
              
              let condition = false;
              if (op === '>') condition = lhs > rhs;
              else if (op === '<') condition = lhs < rhs;
              else if (op === '==') condition = lhs == rhs;
              else if (op === '!=') condition = lhs != rhs;

              const blockStart = i + 1;
              let blockEnd = blockStart;

              // Scan for block end
              let j = blockStart;
              while(j < lines.length) {
                if (lines[j].trim() !== '' && lines[j].search(/\S/) <= indent) break;
                j++;
              }
              blockEnd = j;

              if (condition) {
                 executeBlock(blockStart, indent + 4);
              }
              
              i = blockEnd;
              continue;
           }
        }

      } catch (err: any) {
        output.push(`Error on line ${i+1}: ${err.message}`);
        return lines.length; // Abort
      }

      i++;
    }
    return i;
  }

  try {
    output.push("> Starting execution...");
    executeBlock(0, 0);
    output.push("> Execution finished.");
  } catch (e: any) {
    output.push(`Runtime Error: ${e.message}`);
  }

  return output;
};
