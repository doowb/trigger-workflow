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

export const getLatestWorkflowRun = async (options: TriggerWorkflowOptions, attempt: number = 0): Promise<number> => {
  const { after, owner, repo, workflow_id, token, interval = 5_000 } = options;
  const octokit = new Octokit({ auth: token });

  // Fetch the latest workflow run to get the `run_id`
  const runs = await octokit.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id,
    per_page: 1
  });

  if (runs.data.workflow_runs.length === 0) {
    return attempt >= 3 ? null : getLatestWorkflowRun(options, attempt + 1);
  }

  if (runs.data.workflow_runs.length > 0) {
    const run = runs.data.workflow_runs[0];
    if (new Date(run.created_at).getTime() >= after) {
      return run.id;
    }

    // If the run is older than the `after` timestamp, wait for a new run
    console.log('Waiting for a new workflow run...');
    await new Promise(resolve => setTimeout(resolve, interval));
    return getLatestWorkflowRun(options, attempt + 1);
  }

  return null;
};

export const triggerWorkflow = async (options: TriggerWorkflowOptions): Promise<number> => {
  const { owner, repo, workflow_id, ref, inputs, token } = options;
  const after = Date.now();

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

  return getLatestWorkflowRun({ after, ...options });
};

export const waitForCompletion = async (options: WaitForWorkflowOptions): Promise<void> => {
  const { owner, repo, token, run_id, interval = 5_000 } = options;

  const octokit = new Octokit({ auth: token });
  const differed = {};
  const promise = new Promise<void>((resolve, reject) => {
    differed.resolve = resolve;
    differed.reject = reject;
  });

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
      differed.resolve(run);
    } else {
      console.log(`Workflow run ${run_id} is still in progress...`);
      setTimeout(checkRun, interval);
    }
  };

  checkRun();
  return promise;
};
