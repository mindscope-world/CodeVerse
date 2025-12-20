
import { BlockInstance, RuntimeState } from '../types';

interface StackFrame {
  blockIndex: number;
  children: BlockInstance[];
  loopCounter?: number;
  maxLoops?: number;
  untilCondition?: {
    var: string;
    op: string;
    val: number;
  };
}

export class LogicEngine {
  private program: BlockInstance[];
  private state: RuntimeState;
  private stack: StackFrame[];
  
  constructor(program: BlockInstance[]) {
    this.program = program;
    this.state = {
      variables: {},
      consoleOutput: [],
      currentBlockId: null,
      isRunning: false,
      isFinished: false,
      error: null,
    };
    this.stack = [{ blockIndex: 0, children: this.program }];
  }

  reset() {
    this.state = {
      variables: {},
      consoleOutput: [],
      currentBlockId: null,
      isRunning: false,
      isFinished: false,
      error: null,
    };
    this.stack = [{ blockIndex: 0, children: this.program }];
  }

  getState(): RuntimeState {
    return { ...this.state };
  }

  private evaluateCondition(varName: string, op: string, val: number): boolean {
    const lhs = this.state.variables[varName] || 0;
    const rhs = Number(val);
    if (op === '>') return lhs > rhs;
    if (op === '<') return lhs < rhs;
    if (op === '==') return lhs == rhs;
    if (op === '!=') return lhs != rhs;
    return false;
  }

  step(): RuntimeState {
    if (this.state.isFinished || this.state.error) return { ...this.state };
    this.state.isRunning = true;

    // Find valid stack frame
    let currentFrame = this.stack[this.stack.length - 1];
    
    // Handle end of block list in current frame (pop stack or loop)
    while (currentFrame && currentFrame.blockIndex >= currentFrame.children.length) {
      // 1. Handle Fixed Loop (Repeat X times)
      if (typeof currentFrame.maxLoops === 'number' && typeof currentFrame.loopCounter === 'number') {
        currentFrame.loopCounter++;
        if (currentFrame.loopCounter < currentFrame.maxLoops) {
          currentFrame.blockIndex = 0;
          break; 
        }
      }
      
      // 2. Handle Conditional Loop (Repeat Until)
      if (currentFrame.untilCondition) {
        const cond = currentFrame.untilCondition;
        const isMet = this.evaluateCondition(cond.var, cond.op, cond.val);
        if (!isMet) {
          // Reset index to repeat the body
          currentFrame.blockIndex = 0;
          break;
        }
      }
      
      // Pop stack
      this.stack.pop();
      if (this.stack.length === 0) {
        this.state.isFinished = true;
        this.state.isRunning = false;
        this.state.currentBlockId = null;
        return { ...this.state };
      }
      currentFrame = this.stack[this.stack.length - 1];
    }
    
    // Safety check
    if (!currentFrame) {
        this.state.isFinished = true;
        this.state.isRunning = false;
        return { ...this.state };
    }

    const block = currentFrame.children[currentFrame.blockIndex];
    this.state.currentBlockId = block.id;
    
    // Execute logic
    try {
      this.executeBlockLogic(block);
      
      // Advance index for next step. 
      currentFrame.blockIndex++;
      
    } catch (e: any) {
      this.state.error = e.message;
      this.state.isRunning = false;
    }

    return { ...this.state };
  }

  private executeBlockLogic(block: BlockInstance) {
    switch (block.type) {
      case 'start':
        this.state.consoleOutput.push("> Program Started");
        break;
      case 'print':
        const msg = block.params.message;
        if (this.state.variables.hasOwnProperty(msg)) {
           this.state.consoleOutput.push(`> ${this.state.variables[msg]}`);
        } else {
           this.state.consoleOutput.push(`> ${msg}`);
        }
        break;
      case 'set_var':
        this.state.variables[block.params.name] = Number(block.params.value);
        break;
      case 'change_var':
         if (this.state.variables[block.params.name] === undefined) this.state.variables[block.params.name] = 0;
         this.state.variables[block.params.name] += Number(block.params.value);
         break;
      case 'wait':
        this.state.consoleOutput.push(`> Waiting ${block.params.seconds}s...`);
        break;
      case 'move':
        this.state.consoleOutput.push(`> Avatar moving ${block.params.direction}`);
        break;
      case 'repeat':
        if (block.children && block.children.length > 0) {
            const count = Number(block.params.times) || 1;
            this.stack.push({
                blockIndex: 0,
                children: block.children,
                loopCounter: 0,
                maxLoops: count
            });
        }
        break;
      case 'repeat_until':
        if (block.children && block.children.length > 0) {
            const condVar = block.params.condition_var;
            const op = block.params.operator;
            const val = Number(block.params.value);
            
            // Check condition before starting
            const isMet = this.evaluateCondition(condVar, op, val);
            if (!isMet) {
                this.stack.push({
                    blockIndex: 0,
                    children: block.children,
                    untilCondition: { var: condVar, op, val }
                });
            }
        }
        break;
      case 'if':
        if (block.children && block.children.length > 0) {
            const condition = this.evaluateCondition(
                block.params.condition_var, 
                block.params.operator, 
                Number(block.params.value)
            );
            
            if (condition) {
                 this.stack.push({
                    blockIndex: 0,
                    children: block.children
                });
            }
        }
        break;
    }
  }

  // Generate Python Code from Blocks
  generatePython(): string {
    let code = "# Generated Python Code\nimport time\n\n";
    
    // Scan for all variables defined in the program to help code generation
    const definedVariables = new Set<string>();
    const findVars = (blocks: BlockInstance[]) => {
        blocks.forEach(b => {
            if (b.type === 'set_var' || b.type === 'change_var') {
                definedVariables.add(b.params.name);
            }
            if (b.type === 'if' || b.type === 'repeat_until') {
                 definedVariables.add(b.params.condition_var);
            }
            if (b.children) findVars(b.children);
        });
    };
    findVars(this.program);

    code += "# Setup\navatar = Avatar()\n";
    // Initialize detected variables to 0 to prevent runtime errors in python
    if (definedVariables.size > 0) {
        code += "# Initialize variables\n";
        definedVariables.forEach(v => code += `${v} = 0\n`);
    }
    code += "\n";

    const processBlock = (block: BlockInstance, indent: number): string => {
      const spaces = "    ".repeat(indent);
      let line = "";

      switch (block.type) {
        case 'start':
          line = "# Program Start";
          break;
        case 'print':
          const msg = block.params.message;
          if (definedVariables.has(msg) || !isNaN(Number(msg))) {
             line = `print(${msg})`;
          } else {
             line = `print("${msg}")`;
          }
          break;
        case 'wait':
          line = `time.sleep(${block.params.seconds})`;
          break;
        case 'move':
          line = `avatar.move("${block.params.direction}")`;
          break;
        case 'set_var':
          line = `${block.params.name} = ${block.params.value}`;
          break;
        case 'change_var':
          line = `${block.params.name} += ${block.params.value}`;
          break;
        case 'repeat':
          line = `for i in range(${block.params.times}):`;
          break;
        case 'repeat_until':
          // Python equivalent is 'while not condition:'
          line = `while not (${block.params.condition_var} ${block.params.operator} ${block.params.value}):`;
          break;
        case 'if':
          line = `if ${block.params.condition_var} ${block.params.operator} ${block.params.value}:`;
          break;
        default:
          line = `# Unknown block ${block.type}`;
      }

      let result = spaces + line + "\n";

      if (block.children && block.children.length > 0) {
          block.children.forEach(child => {
              result += processBlock(child, indent + 1);
          });
      }

      return result;
    };

    this.program.forEach(block => {
        code += processBlock(block, 0);
    });

    return code;
  }
}
