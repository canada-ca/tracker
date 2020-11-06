# Codemods

This directory contains scripts for making code changes that are wide-ranging,
complex or both. Codemods are done with Facebook's
[jscodeshift](https://github.com/facebook/jscodeshift) tool which parses
JavaScript into an Abstract Syntax Tree allowing edits on language elements
rather than just strings/characters of text.

## Install

Jscodeshift is installed globally with the following command
```bash
npm install -g jscodeshift
```

## Running the codemod

From the project root, you can try out the codemod with this command:

```
jscodeshift -d -p -t scripts/codemods/remove-dotenv-from-tests.js api-js/src/__tests__/*
```

This command won't make any actual edits (`-d` aka dry run) and will just print
(`-p`) the changes it would have made.

The description of how to do the transformation is contained in
`./transform.js` or whatever file the `-t` flag points to. That transform will
be applied to the files found with the file glob `src/__tests__/*`.
