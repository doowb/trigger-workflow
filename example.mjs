import 'dotenv/config';
import { triggerWorkflow, waitForCompletion } from './dist/index.mjs';

async function main() {
  const token = process.env.GITHUB_TOKEN || 'ghp_YourGithubTokenHere';
  const owner = 'doowb';
  const repo = 'trigger-workflow';
  const workflow_id = 'example-workflow.yml';
  const ref = 'main';

  const run_id = await triggerWorkflow({
    owner,
    repo,
    workflow_id,
    ref,
    token
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
