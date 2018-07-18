Astley 🕶️
=====

Easy AST manipulation. Dynamically modify JavaScript code with ease.

## Example Usage

You can provide Astley with either a string containing ECMAScript code or an actual JavaScript object. In the latter case, it will do its best to turn it into an AST that can be queried and manipulated.

```javascript

const Astley = require('astley');

let astley = Astley.from(`
  // just a plain ol' object

  const neverGonnaGiveYouUp = {

  };
`);

// You can traverse the AST by using the search function.

const neverGonnaGiveYouUp = astley.search(obj => obj.type === 'ObjectExpression');

// Let's add a new property.

neverGonnaGiveYouUp.prop('never', { gonna: 'let you down' });

astley.toString();

/** Which returns: **/ 
 
// // just a plain ol' object

// const neverGonnaGiveYouUp = {
//  never: {
//    gonna: "let you down"
//  }
// };


/** Now let's create an AST straight from an object (let's try a function)... **/

astley = Astley.from(function(){

  console.log('never gonna run around');

});

/** ... and modify its contents! **/

const node = astley.search(o  =>  o.type === 'BlockStatement')[0];

node.append("console.log('and desert you');");

astley.toString();

/** Now our code looks like this: **/

// function() {
//   console.log('never gonna run around');
//   console.log('and desert you');
// }


/** But we can also append new code at a chosen index. **/

node.append("console.log('never gonna let you down');\n", 1);

astley.toString();  

// function() {
//   console.log('never gonna run around');
//   console.log('never gonna let you down');
//   console.log('and desert you');
// }

```

## Installation

```sh

npm install --save astley

```


## API

### Astley

#### AST

Astley uses [recast](https://github.com/benjamn/recast) the generate an AST from ECMAScript code. Astley nodes have a `.ast` property that will allow you to access the tree directly.

[javascript-stringify](https://github.com/blakeembrey/javascript-stringify) is used to convert objects into strings containing ECMAScript literals. This is used to convert an object into an AST by first converting the object into code and then passing it to Recast.  There's surely a better means of converting objects to ASTs, but this seems to work just fine for my needs.

#### Search

Searching objects in the AST is done using a simple filter function. It returns all objects that caused the filter function to return a truthy value. This function is really dumb, but I wrote it because I didn't like how complicated other similar solutions were. All I wanted to do was find objects that contain matching properties.

```javascript

astley.search(obj  =>  obj.type === 'ObjectExpression' && obj.properties.some(x  =>  x.key.name === 'foo'));

```

By default, errors will not be raised from inside the filter function. To allow errors to be thrown, pass the following configuration:

```javascript

astley.search({ throwErrors:  true }, obj  =>  obj.type === 'ObjectExpression');

```

#### Append/Prepend

Appending and prepending works a lot like jQuery if you have a node with a body.

```javascript
astley.append('{placed: "on bottom"}');
```
The append() method will convert the string or object to an AST node and add it to the bottom of the body of the current node.  If the current node has no body, it will simply return `false` and not append anything.

Prepending works the same, but places items at the top of the body.

```javascript
astley.prepend('{goes: "on top"}');
```

But what if you want to append a string literal without wrapping it in a string?  If you must do that, you can use appendString() and prependString() respectively.

Both the append() and prepend() methods support inserting at a specific position.  If you want to insert an item at a specific point in the body of a node, you can pass an index.  Any items inserted will be inserted at that index and the item already at that index will be pushed ahead to make room.

```javascript
astley.append('"put me somewhere";', 5);
```

#### Properties

If a node has a properties object, you can modify those properties with the prop() method:

```javascript
ast.prop('rules', "You know them.");
ast.toString();
// {
//    rules: "You know them."
// }
```

The props() method will write multiple properties from an object.
```javascript
astley.props({
  we: "have known",
  eachOther: "for so long"
});
```

The removeProp() method will remove the property with the given name.

Any of the property methods will return false if the input can't be written to the node(i.e. the node does not have properties).


## Testing

Tests use [Mocha](https://mochajs.org/) w/ [Chai](http://www.chaijs.com/) assertions. Install Mocha globally and run `mocha`.

## Contribute

This project is definitely not feature-complete. If you would like to contribute, please create an issue or a pull-request. Any work contributed should also include tests.

## License

See [LICENSE.txt](LICENSE.txt).