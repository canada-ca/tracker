# Codemods

This directory contains scripts for making code changes that are wide-ranging,
complex or both. Codemods are done with Facebook's
[jscodeshift](https://github.com/facebook/jscodeshift) tool which parses
JavaScript into an Abstract Syntax Tree allowing edits on language elements
rather than just strings/characters of text.

There is a great introductory blog post
[here](https://www.toptal.com/javascript/write-code-to-rewrite-your-code).

## Install

```bash
npm install
```

## Running codemods

In this directory, you can try out the codemod with this command:

```
npm run transform -- -d -p -t replace-console-with-log.js test.js
# if you want to transform code in the api folder:
npm run transform -- -d -p -t remove-dotenv-from-tests.js ../../api-js/src/__tests__/*
```

This command won't make any actual edits (`-d` aka dry run) and will just print
(`-p`) the changes it would have made. Just remove those options to actually
perform the transformation.

The description of how to do the transformation is contained in
`./transform.js` or whatever file the `-t` flag points to. That transform will
be applied to the files found with the file glob `../../api-js/src/__tests__/*`.
