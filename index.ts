import { Octokit } from '@octokit/rest';

interface TriggerWorkflowOptions {
  owner: string;
  repo: string;
  workflow_id: string;
  ref: string;
  inputs?: Record<string, unknown>; // updated type for inputs
  token: string;
}

interface WaitForWorkflowOptions {
  owner: string;
  repo: string;
  token: string;
  run_id: number;
  interval?: number; // milliseconds
}

export const getLatestWorkflowRun = async (options: TriggerWorkflowOptions): Promise<number> => {
  const { owner, repo, workflow_id, token } = options;
  const octokit = new Octokit({ auth: token });

  // Fetch the latest workflow run to get the `run_id`
  const runs = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id,
    per_page: 1
  });

  if (runs.data.workflow_runs.length > 0) {
    return runs.data.workflow_runs[0].id;
  }

  return null;
};

export const triggerWorkflow = async (options: TriggerWorkflowOptions): Promise<number> => {
  const { owner, repo, workflow_id, ref, inputs, token } = options;

  const octokit = new Octokit({ auth: token });
  const response = await octokit.actions.createWorkflowDispatch({
    owner,
    repo,
    workflow_id,
    ref,
    inputs
  });

  if (response.status !== 204) {
    throw new Error(`Failed to trigger workflow: ${response.status}`);
  }

  return getLatestWorkflowRun(options);
};

export const waitForCompletion = (options: WaitForWorkflowOptions): Promise<void> => {
  const { owner, repo, token, run_id, interval = 5_000 } = options;

  const octokit = new Octokit({ auth: token });

  const checkRun = async (): Promise<void> => {
    const { data: run } = await octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id
    });

    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        console.log(`Workflow run ${run_id} completed successfully`);
      } else {
        console.log(`Workflow run ${run_id} completed with conclusion: ${run.conclusion}`);
      }
    } else {
      console.log(`Workflow run ${run_id} is still in progress...`);
      setTimeout(checkRun, interval);
    }
  };

  await checkRun();
};