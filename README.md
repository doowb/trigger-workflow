# trigger-workflow [![NPM version](https://img.shields.io/npm/v/trigger-workflow.svg?style=flat)](https://www.npmjs.com/package/trigger-workflow) [![NPM monthly downloads](https://img.shields.io/npm/dm/trigger-workflow.svg?style=flat)](https://npmjs.org/package/trigger-workflow) [![NPM total downloads](https://img.shields.io/npm/dt/trigger-workflow.svg?style=flat)](https://npmjs.org/package/trigger-workflow)

> Easily trigger GitHub workflows, get latest workflow runs, and wait for workflow runs to complete.

Please consider following this project's author, [Brian Woodward](https://github.com/doowb), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save trigger-workflow
```

## Usage

**Example**

```ts
import { triggerWorkflow, waitForCompletion } from 'trigger-workflow';

async function main() {
  const token = 'ghp_your_github_token_here';
  const owner = 'foo';
  const repo = 'bar';

  const run_id = await triggerWorkflow({
    owner,
    repo,
    token,
    workflow_id: 'my-workflow.yml',
    ref: 'main'
  });

  await waitForCompletion({ owner, repo, token, run_id });

  console.log(`Workflow triggered with run_id: ${run_id}`);
}

main().catch(console.error);
```

## API

This package provides two functions: `triggerWorkflow` and `waitForCompletion`.

### triggerWorkflow

Triggers a GitHub Actions workflow and returns the `run_id` of the triggered workflow.

**Example**

```ts
import { triggerWorkflow } from 'trigger-workflow';

async function main() {
  const run_id = await triggerWorkflow({
    owner: 'foo',
    repo: 'bar',
    token: 'ghp_your_github_token_here',
    workflow_id: 'my-workflow.yml',
    ref: 'main'
  });

  console.log(`Workflow triggered with run_id: ${run_id}`);
}

main().catch(console.error);
```

### waitForCompletion

Waits for a GitHub Actions workflow to complete, polling at a specified interval.

**Example**

```ts
import { triggerWorkflow, waitForCompletion } from 'trigger-workflow';

async function main() {
  const token = 'ghp_your_github_token_here';
  const run_id = '1234567890';
  const owner = 'foo';
  const repo = 'bar';

  await waitForCompletion({
    owner,
    repo,
    token,
    run_id,
    interval: 5000,
  });

  console.log('Workflow completed!');
}

main().catch(console.error);
```

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Contributors

| **Commits** | **Contributor** |  
| --- | --- |  
| 19 | [doowb](https://github.com/doowb) |  
| 2  | [jonschlinkert](https://github.com/jonschlinkert) |  

### Author

**Brian Woodward**

* [GitHub Profile](https://github.com/doowb)
* [Twitter Profile](https://twitter.com/doowb)
* [LinkedIn Profile](https://linkedin.com/in/woodwardbrian)

### License

Copyright © 2024, [Brian Woodward](https://github.com/doowb).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on September 10, 2024._