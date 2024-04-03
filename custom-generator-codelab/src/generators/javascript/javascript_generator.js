/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper functions for generating JavaScript for blocks.
 * @suppress {checkTypes|globalThis}
 */

// Former goog.module ID: Blockly.JavaScript

import * as Blockly from 'blockly/core';
// import type {Block} from '../../core/block.js';
// import {CodeGenerator} from 'blockly/core/generator.js';
// import {Names, NameType} from 'blockly/core/names.js';
// import type {Workspace} from '../../core/workspace.js';
// import {inputTypes} from 'blockly/core/inputs/input_types.js';

/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/JavaScript/Reference/Operators/Operator_Precedence
 * @enum {number}
 */
export const Order = {
  ATOMIC: 0,            // 0 "" ...
  NEW: 1.1,             // new
  MEMBER: 1.2,          // . []
  FUNCTION_CALL: 2,     // ()
  INCREMENT: 3,         // ++
  DECREMENT: 3,         // --
  BITWISE_NOT: 4.1,     // ~
  UNARY_PLUS: 4.2,      // +
  UNARY_NEGATION: 4.3,  // -
  LOGICAL_NOT: 4.4,     // !
  TYPEOF: 4.5,          // typeof
  VOID: 4.6,            // void
  DELETE: 4.7,          // delete
  AWAIT: 4.8,           // await
  EXPONENTIATION: 5.0,  // **
  MULTIPLICATION: 5.1,  // *
  DIVISION: 5.2,        // /
  MODULUS: 5.3,         // %
  SUBTRACTION: 6.1,     // -
  ADDITION: 6.2,        // +
  BITWISE_SHIFT: 7,     // << >> >>>
  RELATIONAL: 8,        // < <= > >=
  IN: 8,                // in
  INSTANCEOF: 8,        // instanceof
  EQUALITY: 9,          // == != === !==
  BITWISE_AND: 10,      // &
  BITWISE_XOR: 11,      // ^
  BITWISE_OR: 12,       // |
  LOGICAL_AND: 13,      // &&
  LOGICAL_OR: 14,       // ||
  CONDITIONAL: 15,      // ?:
  ASSIGNMENT: 16,       //: += -= **= *= /= %= <<= >>= ...
  YIELD: 17,            // yield
  COMMA: 18,            // ,
  NONE: 99,             // (...)
};

export const TYPES = {
  BOOLEAN: 'boolean',
  INTEGER: 'int',
  STRING: 'String',
  FLOAT: 'float',
  LIST: 'List<Object>',
  OBJECT: 'Object',
  UNKNOWN: 'var',
};

//converts a block type into a variable type
export function getType(var_type) {
  switch (var_type) {
    case 'logic_compare': case 'logic_operation': case 'logic_negate': case 'logic_boolean': case 'text_isEmpty': case 'lists_isEmpty': case 'controls_if':
      return TYPES.BOOLEAN;
    case 'lists_length': case 'lists_getIndex': case 'text_length': case 'text_indexOf':
      return TYPES.INTEGER;
    case 'colour_picker': case 'colour_random': case 'colour_rgb': case 'colour_blend':
    case 'text': case 'text_multiline': case 'text_join': case 'text_charAt': case 'text_getSubstring': case 'text_changeCase': case 'text_trim':
      return TYPES.STRING;
    case 'math_number': case 'math_arithmetic': case 'math_single': case 'math_trig': case 'math_constant': case 'math_number_property': case 'math_round': case 'math_on_list': case 'math_modulo': case 'math_constrain': case 'math_random_int': case 'math_random_float':
      return TYPES.FLOAT;
    case 'lists_create_empty': case 'lists_create_with': case 'lists_repeat': case 'lists_getSublist': case 'lists_split': case 'lists_sort':
      return TYPES.LIST;
    case 'logic_null':
      return TYPES.OBJECT;
    default:
      // console.log("Unknown type: " + var_type);
      break;
  }
  return TYPES.UNKNOWN;
}

/*function getVariableTypes(ws) {
  const varTypes = new Map();
  const blocks = ws.getAllBlocks(false);
  // Iterate through every block and add each variable to the set.
  for (let i = 0; i < blocks.length; i++) {
    const blockVariables = blocks[i].getVarModels();
    if (blocks[i].type === 'variables_set' && blocks[i].getInputTargetBlock('VALUE') != null) {
      console.log("Block type: " + blocks[i].type + ", " + blocks[i].getInputTargetBlock('VALUE').type);
      const var_type = blocks[i].getInputTargetBlock('VALUE').type;
      varTypes.set(blocks[i].getFieldValue('VAR'), getType(var_type));
    } else if (blocks[i].type === 'variables_get') {

    } else if (blocks[i].type === 'lists_create_with') {

    }
    if (blockVariables) {
      for (let j = 0; j < blockVariables.length; j++) {
        const variable = blockVariables[j];
        const id = variable.getId();
      }
    }
  }
  return varTypes;
};*/

//returns variable type by searching for usage context.
export function getVariableType(workSpace, varId, useCompares) {
  //if the variable is used for a forLoop, it's an int
  let blocks = workSpace.getBlocksByType('controls_for',true);
  for (let i = 0; i < blocks.length; i++) {
    if(blocks[i].getFieldValue('VAR') === varId) {
      return TYPES.INTEGER;
    }
  }

  let varType = 'var'
  const vars = [];
  let c = 0;
  //search if the variable is ever set
  blocks = workSpace.getBlocksByType('variables_set',true);
  for (let i = 0; i < blocks.length; i++) {
    if(blocks[i].getFieldValue('VAR') === varId) {
      if (blocks[i].getInputTargetBlock('VALUE') != null) {
        //control if it's set to another variable- if yes, use its type.
        if(blocks[i].getInputTargetBlock('VALUE').type === 'variables_get') {
          if(blocks[i].getInputTargetBlock('VALUE').getFieldValue('VAR') !== varId) {
            vars[c] = blocks[i].getInputTargetBlock('VALUE').getFieldValue('VAR');
            c++;
          }
        }
        const var_type = blocks[i].getInputTargetBlock('VALUE').type;
        varType = getType(var_type);
      }
      if(varType !== 'var') {
        return varType;
      }
    }
  }
  //search if the variable is ever used
  blocks = workSpace.getBlocksByType('variables_get',true);
  for (let i = 0; i < blocks.length; i++) {
    if(blocks[i].getFieldValue('VAR') === varId) {
      if (blocks[i].getParent() != null) {
        //logic compares need to be handled differently if they are a parent Block
        if (blocks[i].getParent().type === 'logic_compare') {
          if(useCompares)
          {
            return compareControl(workSpace, blocks[i].getParent(), varId)
          }
        }
        //control if it is used to set a variable. if yes, use that type
        if (blocks[i].getParent().type === 'variables_set') {
          if(blocks[i].getParent().getFieldValue('VAR') !== varId) {
            vars[c] = blocks[i].getParent().getFieldValue('VAR');
            c++;
          }
        }
        varType = getType(blocks[i].getParent().type);
      }
      if(varType !== 'var') {
        return varType;
      }
    }
  }
  for (let i = 0;i < vars.length; i++)
  {
    varType = getVariableType(workSpace, vars[i], true);
    if(varType !== 'var') {
      return varType;
    }
  }
  return varType;
};

//takes a logic_compare block and checks what is compared
//only to be used by the getVarType function
export function compareControl(workSpace, block, varId) {
  if(block.type !== 'logic_compare') {
    return null;
  }

  let left = block.getInputTargetBlock('A');
  let right = block.getInputTargetBlock('B');
  if(left === null || right === null){
    return 'var';
  }
  else if(left.type === 'variables_get' && left.getFieldValue('VAR') === varId) {
    if(right.type === 'variables_get'){
      return getVariableType(workSpace, right.getFieldValue('VAR'), false);
    }
    return getType(right.type);
  }
  else if(right.type === 'variables_get' && right.getFieldValue('VAR') === varId){
    if(left.type === 'variables_get'){
      return getVariableType(workSpace, left.getFieldValue('VAR'), false);
    }
    return getType(left.type);
  }
}

/**
 * JavaScript code generator class.
 */
export class JavascriptGenerator extends Blockly.CodeGenerator {
  /**
   * List of outer-inner pairings that do NOT require parentheses.
   * @type {!Array<!Array<number>>}
   */

  INDENT = '    ';

  ORDER_OVERRIDES = [
    // (foo()).bar -> foo().bar
    // (foo())[0] -> foo()[0]
    [Order.FUNCTION_CALL, Order.MEMBER],
    // (foo())() -> foo()()
    [Order.FUNCTION_CALL, Order.FUNCTION_CALL],
    // (foo.bar).baz -> foo.bar.baz
    // (foo.bar)[0] -> foo.bar[0]
    // (foo[0]).bar -> foo[0].bar
    // (foo[0])[1] -> foo[0][1]
    [Order.MEMBER, Order.MEMBER],
    // (foo.bar)() -> foo.bar()
    // (foo[0])() -> foo[0]()
    [Order.MEMBER, Order.FUNCTION_CALL],

    // !(!foo) -> !!foo
    [Order.LOGICAL_NOT, Order.LOGICAL_NOT],
    // a * (b * c) -> a * b * c
    [Order.MULTIPLICATION, Order.MULTIPLICATION],
    // a + (b + c) -> a + b + c
    [Order.ADDITION, Order.ADDITION],
    // a && (b && c) -> a && b && c
    [Order.LOGICAL_AND, Order.LOGICAL_AND],
    // a || (b || c) -> a || b || c
    [Order.LOGICAL_OR, Order.LOGICAL_OR]
  ];

  constructor(name) {
    super(name ?? 'Java');
    this.isInitialized = false;

    // Copy Order values onto instance for backwards compatibility
    // while ensuring they are not part of the publically-advertised
    // API.
    //
    // TODO(#7085): deprecate these in due course.  (Could initially
    // replace data properties with get accessors that call
    // deprecate.warn().)
    for (const key in Order) {
      this['ORDER_' + key] = Order[key];
    }

    // List of illegal variable names.  This is not intended to be a
    // security feature.  Blockly is 100% client-side, so bypassing
    // this list is trivial.  This is intended to prevent users from
    // accidentally clobbering a built-in object or function.
    this.addReservedWords(
        // Java keywords: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
        'abstract,assert,boolean,break,byte,case,catch,char,class,const,continue,default,' +
        'do,double,else,enum,extends,final,finally,float,for,if,implements,import,' +
        'instanceof,int,interface,long,native,new,package,private,protected,public,' +
        'return,short,static,strictfp,super,switch,synchronized,this,throw,throws,' +
        'transient,try,void,volatile,while,' +
        // Java literals: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
        'false,null,true,' +
        // Java reserved characters in context: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_reserved.html
        'goto,const,' +
        // Everything in the current environment (835 items in Chrome,
        // 104 in Node).
        Object.getOwnPropertyNames(globalThis).join(',')
    );
  }

  /**
   * Initialise the database of variable names.
   * @param {!Workspace} workspace Workspace to generate code from.
   */
  init(workspace) {
    super.init(workspace);

    if (!this.nameDB_) {
      this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
    } else {
      this.nameDB_.reset();
    }

    this.nameDB_.setVariableMap(workspace.getVariableMap());
    this.nameDB_.populateVariables(workspace);
    this.nameDB_.populateProcedures(workspace);

    const defvars = [];
    // Add developer variables (not created or named by the user).
    const devVarList = Blockly.Variables.allDeveloperVariables(workspace);
    for (let i = 0; i < devVarList.length; i++) {
      defvars.push(
          this.nameDB_.getName(devVarList[i], Blockly.Names.NameType.DEVELOPER_VARIABLE));
    }

    let def_map = new Map();
    def_map.set(TYPES.BOOLEAN, "");
    def_map.set(TYPES.INTEGER, "");
    def_map.set(TYPES.STRING, "");
    def_map.set(TYPES.FLOAT, "");
    def_map.set(TYPES.LIST, "");
    def_map.set(TYPES.OBJECT, "");
    def_map.set(TYPES.UNKNOWN, "");


    // Add user variables, but only ones that are being used.
    const variables = Blockly.Variables.allUsedVarModels(workspace);

    // Find variables used as parameters or in foreach loops
    const blocks = workspace.getAllBlocks(false);
    workspace.getBlocksByType()
    let funcs = [];
    let params = [];
    let c = 0;

    for(let b = 0; b < blocks.length; b++)
    {
      if(blocks[b].type === 'procedures_defnoreturn' ||
          blocks[b].type === 'procedures_defreturn' ||
          blocks[b].type === 'controls_forEach')
      {
        funcs[c] = blocks[b];
        c++;
      }
    }
    c = 0;
    for(let f = 0; f < funcs.length; f++)
    {
      let blockParams = funcs[f].getVarModels();
      for(let g = 0; g < blockParams.length; g++)
      {
        params[c] = blockParams[g];
        c++;
      }
    }

    //Add definitions for not parameter variables
    for (let i = 0; i < variables.length; i++) {
      let par = false;

      for(let j = 0; j < params.length; j++) {

        if(params[j] === variables[i]) {
          par = true;
          break;
        }
      }

      if(!par) {
        let name = this.nameDB_.getName(variables[i].getId(), Blockly.Names.NameType.VARIABLE);
        let type = getVariableType(workspace, variables[i].getId(), true);
        let definition = def_map.get(type);
        if(type === 'var')
        {
          definition += type + ' ' + name + ' = 0;\n';
        }
        else if (definition === "") {
          definition = type + " " + name;
        } else {
          definition += ", " + name;
        }
        def_map.set(type, definition);
      }
    }

    let variable_definitions = "";
    for (let [key, value] of def_map) {
      if (value !== "" && key !== 'var') {
        variable_definitions += value + ";\n";
      }
      if(key === 'var')
      {
        variable_definitions += value;
      }
    }
    this.definitions_['variables'] = variable_definitions;

    // Declare all of the variables.
    /*if (defvars.length) {
      this.definitions_['variables'] = 'var ' + defvars.join(', ') + ';';
    }*/
    this.isInitialized = true;
  }

  /**
   * Prepend the generated code with the variable definitions.
   * @param {string} code Generated code.
   * @return {string} Completed code.
   */
  finish(code) {
    // Convert the definitions dictionary into a list.
    const definitions = Object.values(this.definitions_);
    // Call Blockly.CodeGenerator's finish.
    super.finish(code);
    this.isInitialized = false;

    this.nameDB_.reset();
    return definitions.join('\n\n') + '\n\n\n' + code;
  }

  /**
   * Naked values are top-level blocks with outputs that aren't plugged into
   * anything.  A trailing semicolon is needed to make this legal.
   * @param {string} line Line of generated code.
   * @return {string} Legal line of code.
   */
  scrubNakedValue(line) {
    return line + '\n';
  }

  /**
   * Encode a string as a properly escaped JavaScript string, complete with
   * quotes.
   * @param {string} string Text to encode.
   * @return {string} JavaScript string.
   */
  quote_(string) {
    // Can't use goog.string.quote since Google's style guide recommends
    // JS string literals use single quotes.
    string = string.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\\n')
        .replace(/'/g, '\\\'');
    return '\"' + string + '\"';
  }

  /**
   * Encode a string as a properly escaped multiline JavaScript string, complete
   * with quotes.
   * @param {string} string Text to encode.
   * @return {string} JavaScript string.
   */
  multiline_quote_(string) {
    // Can't use goog.string.quote since Google's style guide recommends
    // JS string literals use single quotes.
    const lines = string.split(/\n/g).map(this.quote_);
    return lines.join(' + \"\\n\" +\n');
  }

  /**
   * Common tasks for generating JavaScript from blocks.
   * Handles comments for the specified block and any connected value blocks.
   * Calls any statements following this block.
   * @param {!Block} block The current block.
   * @param {string} code The JavaScript code created for this block.
   * @param {boolean=} opt_thisOnly True to generate code for only this
   *     statement.
   * @return {string} JavaScript code with comments and subsequent blocks added.
   * @protected
   */
  scrub_(block, code, opt_thisOnly) {
    if (!(block.getRootBlock().type === 'procedures_defnoreturn' || block.getRootBlock().type ==='procedures_defreturn')) {
      return '!!! Warnung, ein Block wurde nicht übersetzt !!!';
    }
      let commentCode = '';
      // Only collect comments for blocks that aren't inline.
      if (!block.outputConnection || !block.outputConnection.targetConnection) {
        // Collect comment for this block.
        let comment = block.getCommentText();
        if (comment) {
          comment = Blockly.utils.string.wrap(comment, this.COMMENT_WRAP - 3);
          commentCode += this.prefixLines(comment + '\n', '// ');
        }
        // Collect comments for all value arguments.
        // Don't collect comments for nested statements.
        for (let i = 0; i < block.inputList.length; i++) {
          if (block.inputList[i].type === Blockly.inputTypes.VALUE) {
            const childBlock = block.inputList[i].connection.targetBlock();
            if (childBlock) {
              comment = this.allNestedComments(childBlock);
              if (comment) {
                commentCode += this.prefixLines(comment, '// ');
              }
            }
          }
        }
      }
      const nextBlock =
          block.nextConnection && block.nextConnection.targetBlock();
      const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
      return commentCode + code + nextCode;
  }

  /**
   * Gets a property and adjusts the value while taking into account indexing.
   * @param {!Block} block The block.
   * @param {string} atId The property ID of the element to get.
   * @param {number=} opt_delta Value to add.
   * @param {boolean=} opt_negate Whether to negate the value.
   * @param {number=} opt_order The highest order acting on this value.
   * @return {string|number}
   */
  getAdjusted(block, atId, opt_delta, opt_negate, opt_order) {
    let delta = opt_delta || 0;
    let order = opt_order || this.ORDER_NONE;
    if (block.workspace.options.oneBasedIndex) {
      delta--;
    }
    const defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';

    let innerOrder;
    let outerOrder = order;
    if (delta > 0) {
      outerOrder = this.ORDER_ADDITION;
      innerOrder = this.ORDER_ADDITION;
    } else if (delta < 0) {
      outerOrder = this.ORDER_SUBTRACTION;
      innerOrder = this.ORDER_SUBTRACTION;
    } else if (opt_negate) {
      outerOrder = this.ORDER_UNARY_NEGATION;
      innerOrder = this.ORDER_UNARY_NEGATION;
    }

    let at = this.valueToCode(block, atId, outerOrder) || defaultAtIndex;

    if (Blockly.utils.string.isNumber(at)) {
      // If the index is a naked number, adjust it right now.
      at = Number(at) + delta;
      if (opt_negate) {
        at = -at;
      }
    } else {
      // If the index is dynamic, adjust it in code.
      if (delta > 0) {
        at = at + ' + ' + delta;
      } else if (delta < 0) {
        at = at + ' - ' + -delta;
      }
      if (opt_negate) {
        if (delta) {
          at = '-(' + at + ')';
        } else {
          at = '-' + at;
        }
      }
      innerOrder = Math.floor(innerOrder);
      order = Math.floor(order);
      if (innerOrder && order >= innerOrder) {
        at = '(' + at + ')';
      }
    }
    return at;
  }
}
