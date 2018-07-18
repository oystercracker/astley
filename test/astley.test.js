'use strict';

const { assert } = require('chai'),
        Astley   = require('../index');

describe('astley', function(){
  describe('from()', function(){
    it('parses a codestring to an AST', function(){
      const code = 'new GottaMakeYouUnderstand();'
      const astley = Astley.fromString(code);
      assert.exists(astley.ast);
      assert.isAbove(astley.length, 0);
      assert.notEmpty(astley.body);
    });
    it('parses an object to an AST', function(){
      function youKnowTheRulesAndSoDoI(){}
      const astley = Astley.fromString(youKnowTheRulesAndSoDoI);
      assert.exists(astley.ast);
      assert.isAbove(astley.length, 0);
      assert.notEmpty(astley.body);
      assert.equal(astley.body[0].type, 'FunctionDeclaration');
      assert.equal(astley.body[0].id.name, 'youKnowTheRulesAndSoDoI');
    });
  });
  describe('fromString()', function(){
    it('creates an AST from a string of code', function(){
      const code = `
        function youWouldntGetThisFromAnyOtherGuy(){
          console.log("hey dawg, I heard you like code, so I put code inside your code");
        }
      `;
      const astley = Astley.fromString(code);
      assert.exists(astley.ast);
      assert.isAbove(astley.length, 0);
    });
  });
  describe('fromObject()', function(){
    it('creates an AST based on an object', function(){
      const myObject = {
        never: {
          gonna: 'give you up'
        }
      };
      const astley = Astley.fromObject(myObject);
      assert.exists(astley.ast);
      assert.isAbove(astley.length, 0);
      assert.match(astley.toString(), /never/);
      assert.match(astley.toString(), /gonna/);
      assert.match(astley.toString(), /give you up/);
    });
  });
  describe('search()', function(){
    it('can find an object in the AST', function(){
      const myObject = {
        never: {
          gonna: 'let you down'
        }
      };
      const astley = Astley.fromObject(myObject),
            node   = astley.search(obj => obj.label.name === 'gonna')[0],
            val    = node.ast.body.expression.value;
      assert.equal(node.ast.label.name, 'gonna');
      assert.equal(val, 'let you down');
    });
    it('does not raise an exception from the filter function', function(){
      const astley = Astley.fromObject({});
      astley.search(obj => gave.up === and.let.you.down );
    });
    it('can be configured to raise an exception', function(){
      const astley = Astley.fromObject({});
      try {
        astley.search({ throwErrors: true }, obj => still === wrong );
      } catch(err){
        return assert.exists(err);
      }
      throw new Error('There wasn\'t supposed to be an error here.');
    });
    it('can chain searches', function(){
      const myObject = {
        never: {
          gonna: 'run around'
        }
      };
      const astley  = Astley.fromObject(myObject),
            results = astley.search(obj => obj.label.name === 'never')
                            .search(obj => obj.label.name === 'gonna');
      assert.notEmpty(results);
    });
    it('can search by parent object', function(){
      const myObject = {
        youKnowTheRules: {
          andSo: {
            do: 'i'
          }
        }
      };
      const astley = Astley.fromObject(myObject),
            result = astley.search(x => x.parent.key.name == 'andSo' && x.type == 'ObjectExpression')[0];
      assert.equal(result.ast.properties[0].key.value, 'do');
    });
  });
  describe('prop()', function(){
    it('can add properties to object expressions', function(){
      const astley = Astley.fromString(`({ and: 'desert' });`),
            node   = astley.search(obj => obj.type === 'ObjectExpression');
      node.prop('desert', 'you');
      const code   = astley.toString(),
            output = eval(code);
      assert.equal(output.and, 'desert');
      assert.equal(output.desert, 'you');
    });
  });
  describe('props()', function(){
    it('can add multiple properties to an object expression from an object', function(){
      const newProps = {
        never: {
          gonna: {
            let: new Date(12345)
          }
        },
        you: {
          down: function(){}
        }
      };
      const astley = Astley.fromString(`({ ijust: 'want to tell you how i"m feeling' })`),
            node   = astley.search(obj => obj.type === 'ObjectExpression');
      node.props(newProps);
      const output = eval(astley.toString());
      assert.equal(output.ijust, 'want to tell you how i"m feeling');
      assert.equal(output.never.gonna.let.getTime(), 12345);
      assert.equal(typeof output.you.down, 'function');
    });
  });
  describe('append()', function(){
    it('parses a string and appends a node to the body of an expression', function(){
      const astley = Astley.fromObject();
      assert.isEmpty(astley.body);
      astley.append('function giveYouUp(){}');
      debugger
      assert.isNotEmpty(astley.body);
      assert.match(astley.toString(), /function giveYouUp\(\)\{\}/);
    });
    it('parses an object and appends a node to the body of an expression', function(){
      const astley = Astley.fromObject();
      assert.isEmpty(astley.body);
      astley.append(function neverGonnaGive(){});
      assert.isNotEmpty(astley.body);
      assert.match(astley.toString(), /function neverGonnaGive\(\)\{\}/);
    });
    it('inserts an object at an index', function(){
      const astley = Astley.fromString('{};{};');
      assert.isNotEmpty(astley.body);
      astley.append(function neverGonnaGive(){}, 1);
      assert.equal(astley.body[1].type, 'FunctionDeclaration');
      assert.equal(astley.toString(), '{}function neverGonnaGive(){}{}');
    });
  });
  describe('prepend()', function(){
    it('parses a string and prepends a node to the body of an expression', function(){
      const astley = Astley.fromObject();
      assert.isEmpty(astley.body);
      astley.prepend('function letYouDown(){}');
      debugger
      assert.isNotEmpty(astley.body);
      assert.match(astley.toString(), /function letYouDown\(\)\{\}/);
    });
    it('parses an object and prepends a node to the body of an expression', function(){
      const astley = Astley.fromObject();
      assert.isEmpty(astley.body);
      astley.prepend(function runAround(){});
      assert.isNotEmpty(astley.body);
      assert.match(astley.toString(), /function runAround\(\)\{\}/);
    });
    it('inserts an object at an index', function(){
      const astley = Astley.fromString('{};{};');
      assert.isNotEmpty(astley.body);
      astley.prepend(function tellALie(){}, 1);
      assert.equal(astley.body[1].type, 'FunctionDeclaration');
      assert.equal(astley.toString(), '{}function tellALie(){}{}');
    });
  });
  describe('removeProp()', function(){
    it('can remove a property from an object expression', function(){
      const astley = Astley.fromString(`({ makeYou: 'cry' })`),
            node   = astley.search(obj => obj.type === 'ObjectExpression');
      assert.match(astley.toString(), /makeYou/);
      assert.isNotEmpty(node[0].properties);
      node.removeProp('makeYou');
      assert.isEmpty(node[0].properties);
      assert.notMatch(astley.toString(), /makeYou/);
    });
  });
  describe('appendString()', function(){
    it('appends an object to the body of an expression', function(){
      const astley = Astley.fromObject();
      assert.isEmpty(astley.body);
      astley.appendString('function giveYouUp(){}');
      assert.isNotEmpty(astley.body);
      assert.match(astley.toString(), /function giveYouUp\(\)\{\}/);
    });
  });
  describe('appendObject()', function(){
    it('appends an object to the body of an expression', function(){
      const astley = Astley.fromObject();
      assert.isEmpty(astley.body);
      astley.appendObject(function iJustWannaTellYou(){});
      assert.isNotEmpty(astley.body);
      assert.match(astley.toString(), /function iJustWannaTellYou\(\)\{\}/);
    });
  });
});

