# DB scripts

This folder contains various scripts for doing things to the database. 
Internally ArangoDB uses the same [V8 JavaScript engine](https://v8.dev/) as Node.js and Chrome, and scripting it is mostly "just JavaScript".
Note that scripts executed this way are synchronous and use the [db object](https://www.arangodb.com/docs/stable/appendix-references-dbobject.html) rather than [arangojs](https://arangodb.github.io/arangojs/).

These scripts serve as an example of what scripting with ArangoDB looks like, and are intended to be executed with `arangosh`:
```
arangosh --javascript.execute remove-orphans.js
```
