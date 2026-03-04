# mcp/prd_server.py — BiasharaSmart PRD MCP Server
from fastmcp import FastMCP
import json, pathlib

mcp = FastMCP('biasharasmart-prd')
prd = json.loads(pathlib.Path(__file__).parent.joinpath('prd_features.json').read_text())

@mcp.resource('prd://features/{feature_id}')
def get_feature(feature_id: str) -> str:
    return json.dumps(prd.get(feature_id, {'error': f'Feature {feature_id} not found'}))

@mcp.tool()
def get_acceptance_criteria(feature_id: str) -> list:
    """Get the acceptance criteria for a feature before building it"""
    if feature_id not in prd:
        return [f'ERROR: {feature_id} not found in PRD']
    return prd[feature_id]['acceptance_criteria']

@mcp.tool()
def get_subtasks(feature_id: str) -> list:
    """Get the subtasks for a feature"""
    if feature_id not in prd:
        return [f'ERROR: {feature_id} not found in PRD']
    return prd[feature_id]['subtasks']

@mcp.tool()
def list_features_by_phase(phase: int) -> list:
    """List all feature IDs in a given phase"""
    return [k for k, v in prd.items() if v.get('phase') == phase]

if __name__ == '__main__':
    mcp.run()
