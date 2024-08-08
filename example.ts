import { triggerWorkflow, onCompletion } from 'trigger-workflow';

async function main() {
  const token = 'ghp_YourGithubTokenHere';
  const owner = 'my-org';
  const repo = 'my-repo';
  const workflow_id = 'my-workflow.yml';
  const ref = 'main';

  const run_id = await triggerWorkflow({
    owner,
    repo,
    workflow_id,
    ref,
    token
  });

  await onCompletion({
    owner,
    repo,
    run_id,
    token
  });

  console.log('Workflow completed!');
}

main().catch(console.error);
