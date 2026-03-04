from fastmcp import FastMCP
import json, pathlib
from datetime import datetime, timezone

mcp = FastMCP('progress-tracker')
PROGRESS_FILE = pathlib.Path(__file__).parent.parent / 'progress.txt'

@mcp.resource('progress://current')
def get_progress() -> dict:
    return json.loads(PROGRESS_FILE.read_text())

@mcp.tool()
def get_task_status(task_id: str) -> dict:
    """Get status and notes for a specific task"""
    data = json.loads(PROGRESS_FILE.read_text())
    return data['tasks'].get(task_id, {'error': f'{task_id} not found'})

@mcp.tool()
def list_completed_tasks() -> list:
    """Return all tasks with status complete"""
    data = json.loads(PROGRESS_FILE.read_text())
    return [k for k, v in data['tasks'].items() if v.get('status') == 'complete']

@mcp.tool()
def list_pending_tasks() -> list:
    """Return all tasks not yet complete"""
    data = json.loads(PROGRESS_FILE.read_text())
    return [k for k, v in data['tasks'].items() if v.get('status') != 'complete']

@mcp.tool()
def update_task_status(task_id: str, status: str, notes: str) -> bool:
    """Called at session end to record pass/fail"""
    valid = ['complete', 'failed', 'in_progress', 'not_started']
    if status not in valid:
        raise ValueError(f'Status must be one of: {valid}')
    data = json.loads(PROGRESS_FILE.read_text())
    if task_id not in data['tasks']:
        raise ValueError(f'Task {task_id} not found')
    data['tasks'][task_id] = {'status': status, 'notes': notes}
    data['current_task'] = task_id
    data['last_updated'] = datetime.now(timezone.utc).isoformat()
    PROGRESS_FILE.write_text(json.dumps(data, indent=2))
    return True

if __name__ == '__main__':
    mcp.run()
