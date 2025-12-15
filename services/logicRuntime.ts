import { BlockInstance, RuntimeState } from '../types';

export class LogicEngine {
  private program: BlockInstance[];
  private state: RuntimeState;
  private stack: { blockIndex: number; children: BlockInstance[]; loopCounter?: number; maxLoops?: number }[];
  
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

  step(): RuntimeState {
    if (this.state.isFinished || this.state.error) return { ...this.state };
    this.state.isRunning = true;

    // Find valid stack frame
    let currentFrame = this.stack[this.stack.length - 1];
    
    // Handle end of block list in current frame (pop stack or loop)
    while (currentFrame && currentFrame.blockIndex >= currentFrame.children.length) {
      // If it's a loop frame, check if we should repeat
      if (typeof currentFrame.maxLoops === 'number' && typeof currentFrame.loopCounter === 'number') {
        currentFrame.loopCounter++;
        if (currentFrame.loopCounter < currentFrame.maxLoops) {
          // Restart loop
          currentFrame.blockIndex = 0;
          break; // Continue execution in this frame
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
      // Even if we pushed a child frame, we advance the parent index so that when we return (pop), we are at the next instruction.
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
        // Check if message is a variable
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
         if (!this.state.variables[block.params.name]) this.state.variables[block.params.name] = 0;
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
      case 'if':
        if (block.children && block.children.length > 0) {
            const lhs = this.state.variables[block.params.condition_var] || 0;
            const rhs = Number(block.params.value);
            const op = block.params.operator;
            let condition = false;
            
            if (op === '>') condition = lhs > rhs;
            else if (op === '<') condition = lhs < rhs;
            else if (op === '==') condition = lhs == rhs;
            
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
            if (b.type === 'if') {
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