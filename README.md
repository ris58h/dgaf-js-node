# Overview
JS that DGAF

# Installation
```
# Locally in your project.
npm install -D dgaf-js

# Or globally.
npm install -g dgaf-js
```

# Usage
## Transpile
```
# Transpile a script.
dgaf-js script.js

# Transpile code.
dgaf-js -c 'console.log(x)'

# Pipe code to transpiler.
echo 'console.log(x)' | dgaf-js
```
## Execute
Using current node:
```
# Execute a script.
dgaf-js-node script.js

# Execute code.
dgaf-js-node -c 'console.log(x)'

# Pipe code to executor.
echo 'console.log(x)' | dgaf-js-node
```
Using pipe:
```
# Execute a script.
dgaf-js script.js | node

# Execute code.
dgaf-js -c 'console.log(x)' | node

# Pipes everywhere.
echo 'console.log(x)' | dgaf-js | node
```
