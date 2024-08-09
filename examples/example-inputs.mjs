import 'dotenv/config';
import { triggerWorkflow, waitForCompletion } from '../dist/index.mjs';

async function main() {
  const token = process.env.GITHUB_TOKEN || 'ghp_YourGithubTokenHere';
  const owner = 'doowb';
  const repo = 'trigger-workflow';
  const workflow_id = 'example-inputs.yml';
  const ref = 'main';
  const inputs = {
    message: 'Hello from the message input!'
  };

  const run_id = await triggerWorkflow({
    owner,
    repo,
    workflow_id,
    ref,
    token,
    inputs
  });

  await waitForCompletion({
    owner,
    repo,
    run_id,
    token
  });

  console.log('Workflow completed!');
}

main().catch(console.error);
