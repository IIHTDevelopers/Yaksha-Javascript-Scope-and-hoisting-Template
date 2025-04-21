// Example of hoisting with var
console.log(myVar); // undefined (due to hoisting with var)
var myVar = 'Hello, world!';

// Example of hoisting with let and const
try {
    console.log(myLet); // ReferenceError: Cannot access 'myLet' before initialization
} catch (e) {
    console.log(e.message);
}
let myLet = 'Hello, let!';

try {
    console.log(myConst); // ReferenceError: Cannot access 'myConst' before initialization
} catch (e) {
    console.log(e.message);
}
const myConst = 'Hello, const!';

// Scope example with var
function testVarScope() {
    var varInFunction = 'Inside function scope';
    console.log(varInFunction); // Inside function scope
}
testVarScope();
// console.log(varInFunction); // Error: varInFunction is not defined, because it is inside the function

// Scope example with let and const
function testLetConstScope() {
    let letInFunction = 'Inside function scope with let';
    const constInFunction = 'Inside function scope with const';
    console.log(letInFunction); // Inside function scope with let
    console.log(constInFunction); // Inside function scope with const
}
testLetConstScope();
// console.log(letInFunction); // Error: letInFunction is not defined, because it is inside the function
// console.log(constInFunction); // Error: constInFunction is not defined, because it is inside the function
