'use strict';

const recast    = require('recast'),
      stringify = require('javascript-stringify'),
    { entries,
      values,
      assign }  = Object,
    { isPlainObject,
      isNil }   = require('./utils');


class Astley extends Array {
  /** 
   * Parses a codestring to an AST or converts an object to an AST.
   * @param {*} object - An object to be converted to an AST, unless it is a string, in which case it will be parsed for ECMAscript.
  */
  static from(object){
    if(typeof object === 'string') return this.fromString(object);
    return this.fromObject(object);
  }
  /**
   * Parses a string of ECMAScript code into an AST.
   */
  static fromString(string){
    let astley;
    try {
      astley = new this(stringToAST(string));
    } catch(err){
      // For some reason, Esprima doesn't like a string with only a function expression,
      // so we'll attempt to work around this by wrapping the code with parenteses 
      // to create an expression statement and then we'll extract the function expression
      // and turn it in to a declaration.
      if(!err.description || !err.description.match(/Unexpected token/)) throw err;
      astley = new this(stringToAST(`(${string})`));
      const body = astley[0].ast.program.body,
            expressionStatement = body.pop(),
            expression          = expressionStatement.expression;
      expression.type = expression.type.replace(/Expression$/, 'Declaration');
      body.push(expression);
    }
    astley.ast = astley[0].ast;
    return astley;
  }
  /**
   * Converts an object into an AST.
   */
  static fromObject(obj, replacer=null, amount=2){
    const codestring = isNil(obj) ? '' : stringify(obj, replacer, amount);
    return this.fromString(codestring);
  }
  /**
   * Creates an collection of ASTs.
   * @param {...object} asts
   */
  constructor(...objects){
    const flattened = objects.reduce((acc, val) => acc.concat(val), []),
          asts      = [];
    flattened.forEach(obj => {
      if(isPlainObject(obj)){
        asts.push(obj);
      }
    });
    const nodes = asts.map(a => a.constructor === AstleyNode ? a : new AstleyNode(a));
    super(...nodes);
  }
  get body(){
    if(this.ast && this.ast.program && this.ast.program.body) return this.ast.program.body;
    if(this.ast && this.ast.body) return this.ast.body;
  }
  /**
   * If the object has an AST, return a string of ECMAScript code generated from the AST.
   * Otherwise, return a concatenation of all stringified code from child nodes.
   */
  toString(params={}){
    if(this.ast){
      return recast.print(this.ast, params).code;
    } else {
      return this.map(node => node.toString(params)).join('');
    }
  }
  /** 
   * Same as AstleyNode.search() but will search all child nodes.
   */
  search(){
    return this.map(node => node.search(...arguments))
               .reduce((acc, val) => acc.concat(val), new this.constructor());
  }
  /**
   * Same as AstleyNode.prepend() but will apply to all child nodes.
   * @param {object} object 
   */
  prepend(object){
    this.forEach(node => node.prepend(object));
  }
  /**
   * Same as AstleyNode.append() but will apply to all child nodes.
   */
  append(codestring){
    this.forEach(node => node.append(codestring));
  }
  /**
   * Same as AstleyNode.prependString() but will apply to all child nodes.
   */
  prependString(codestring){
    this.forEach(node => node.prependString(codestring));
  }
  /**
   * Same as AstleyNode.prependObject() but will apply to all child nodes.
   * @param {object} object 
   */
  prependObject(object){
    this.forEach(node => node.prependObject(object));
  }
  /**
   * Same as AstleyNode.appendString() but will apply to all child nodes.
   */
  appendString(codestring){
    this.forEach(node => node.appendString(codestring));
  }
  /**
   * Same as AstleyNode.appendObject() but will apply to all child nodes.
   * @param {object} object 
   */
  appendObject(object){
    this.forEach(node => node.appendObject(object));
  }
  /**
   * Same as AstleyNode.prop() but will apply to all child nodes.
   */
  prop(name, value){
    this.forEach(node => node.prop(name, value));
  }
  /**
   * Same as AstleyNode.props() but will apply to all child nodes.
   */
  props(obj){
    this.forEach(node => node.props(obj));
  }
  /**
   * Same was AstleyNode.removeProp() but will apply to all child nodes.
   */
  removeProp(){
    this.forEach(node => node.removeProp(...arguments));
  }
}

class AstleyNode {
  /**
   * Creates a new Astley wrapper instance from either a string containing JavaScript
   * code or an existing AST.
   * @param {string|object} obj 
   */
  constructor(obj){
    this.ast = obj;
  }
  get properties(){
    return this.ast && this.ast.properties ? this.ast.properties : null;
  }
  /**
   * The body array of the node or the body array of the program if this is a Script node.
   */
  get body(){
    if(this.ast && this.ast.program && this.ast.program.body) return this.ast.program.body;
    if(this.ast && this.ast.body) return this.ast.body;
  }
  /** 
   * Returns the AST converted to a string of ECMAScript.
  */
  toString(params={}){
    return recast.print(this.ast, params).code;
  }
  /** 
   * Crawls the AST and returns any nodes that pass the given test function.
   * @param {object}   options             - An optional object of options keys.  
   * @param {boolean}  options.throwErrors - When set to true, errors will be thrown in the test function.  This is useful for diagnosing why the function isn't working as expected.
   * @param {function} testFunction        - Gets passed objects and allows an object to become a part of the search results if it returns a truthy value.
   * @example
   *   astley.search(obj => obj.name === 'ObjectExpression');
   *   // or
   *   astley.search({throwErrors: true}, obj => obj.name === 'ObjectExpression');
   */
  search(){
    if(!this.ast) throw new Error('Search expects an AST but none found.')
    const args    = Array.from(arguments),
          fn      = args.pop(),
          options = args.pop() || {},
          index   = [];
    if(typeof fn !== 'function') throw new Error('Search method expects a callback function.');
    function buildIndex(node, parent){
      const indice  = assign({}, node);
      indice.__node = node;
      indice.parent = parent;
      if(Array.isArray(node))  return node.forEach(i => buildIndex(i, indice));
      if(!isPlainObject(node)) return;
      // index object if we don't already have it
      if(index.indexOf(node) < 0) index.push(indice);
      values(node).forEach(value => buildIndex(value, indice));
    }
    buildIndex(this.ast);
    const results = [],
          len     = index.length;
    let i = 0;
    while(i<len){
      try {
        const item = index[i];
        if(fn(item, item.parent)) results.push(item.__node);
      } catch(err) {
        if(options.throwErrors) throw err;
      }
      i++;
    }
    return new Astley(...results);
  }
  /**
   * If the argument is a string, it will be parsed as JavaScript and placed at the end of the body of the node.
   * If the argument is any other object, it will be converted to a node and placed in th end of the body.
   * @param {*} object  - Any JavaScript object.
   * @param {number} at - An index at which to add the object to the body.
   */
  append(object){
    if(typeof object === 'string') return this.appendString(...arguments);
    return this.appendObject(...arguments);
  }
  /**
   * If the argument is a string, it will be parsed as JavaScript and placed at the beginning of the body of the node.
   * If the argument is any other object, it will be converted to a node and placed in th beginning of the body.
   * @param {*} object  - Any JavaScript object.
   * @param {number} at - An index at which to add the object to the body.
   */
  prepend(object){
    if(typeof object === 'string') return this.prependString(...arguments);
    return this.prependObject(...arguments);
  }
  /** 
   * Converts an object to an AST and places it in the end of body of the node.
   * @param {*} object  - Any JavaScript object.
   * @param {number} at - An index at which to add the object to the body.
   */
  appendObject(object, at){
    const codestring = stringify(object);
    return this.appendString(codestring, at);
  }
  /**
   * Parses a string of code and places that code into the end of body of the node.
   * @param {string} string - A string of code that will be parsed and converted to an AST and placed in the body of the node; 
   * @param {number} at - An index at which to add the parsed object to the body.
   */
  appendString(string, at, shouldPrepend=true){
    if(!this.body) return false;
    const fragment = new AstleyNode(stringToAST(string)),
          body     = fragment.ast.program.body;
    at = isNil(at) ? body.length : at;
    body.forEach(obj => { 
      this.body.splice(at, 0, obj);
    });
    return true;
  }
  /** 
   * Converts an object to an AST and places it in the beginning of the body of the node.
   * @param {*} object - Any JavaScript object.
   */
  prependObject(object){
    const codestring = stringify(object);
    return this.prependString(codestring);
  }
  /**
   * Parses a string of code and places that code into the beginning of body of the node.
   * @param {string} string - A string of code that will be parsed and converted to an AST and placed in the body of the node; 
   */
  prependString(string){
    return this.appendString(string, null, true);
  }
  /**
   * Accesses an object property by name or sets one with a provided value, if given.
   * @param {string} name
   * @param {*} value
   */
  prop(name, value){
    if(!Array.isArray(this.properties)) return false;
    if(arguments.length === 1) return this.properties.find(p => (p.key || {}).name === name); 
    const properties  = this.properties,
          oIndex      = properties.map(p => p.key.name === name).indexOf(name) || properties.length - 1,
          index       = oIndex > -1 ? oIntex : 0,
          outObj      = {};
    outObj[name] = value;
    const fragment = new AstleyNode(stringToAST(`(${stringify(outObj)})`));
    const props = fragment.search(x => x.type === 'ObjectExpression')[0].properties || [];
    props.forEach(item => {
      properties.splice(index, 0, item);
    });
    return true;
  }
  /**
   * Adds properties to an object expression from a provided object.
   * @param {object} obj - An object of key/value pairs to add to an object expression in the AST.
   * 
   */
  props(obj){
    if(!isPlainObject(obj)) return false;
    return entries(obj).every((pair) => this.prop(...pair));
  }
  /**
   * Removes a property of an object given either a name or a filter function.
   * @param {string|function} filter
   * @example 
   * objectExpression.removeProp('foobar');
   * // or
   * objectExpression.removeProp(p => p.key && p.key.name === 'foobar');
   */
  removeProp(){
    if(!Array.isArray(this.properties)) return false;
    const properties = this.properties;
    if(typeof arguments[0] === 'function'){
      const fn = arguments[0];
      properties.forEach((prop, i) => {
        if(fn(prop)) properties.splice(i, 1);
      });
    } else if(typeof arguments[0] === 'string'){
      const name = arguments[0],
            property = properties.find(p => p.key && p.key.name === name);
      if(property) properties.splice(properties.indexOf(property), 1);
    }
    return true;
  }
}

function stringToAST(string){
  const ast = recast.parse(string);
  return ast;
  recast.visit(ast, {
    visitLiteral: function(path) {
      if (typeof path.value.value === 'string') {
        var quote = path.value.raw[0],
            value = path.value.value,
            literal = quote + value + quote;
        path.value.value = new String(literal);
      }
      this.traverse(path);
    }
  });
  return ast;
}

module.exports = Astley;

