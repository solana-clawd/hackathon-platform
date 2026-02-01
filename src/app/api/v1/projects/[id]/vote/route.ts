import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await getDb();
    
    const projectResult = await client.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [params.id] });
    const project = projectResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if already voted
    const existingResult = await client.execute({ sql: 'SELECT * FROM votes WHERE agent_id = ? AND project_id = ?', args: [agent.id, params.id] });
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Already voted for this project' }, { status: 409 });
    }

    // Can't vote for own project
    const membershipResult = await client.execute({ sql: 'SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?', args: [project.team_id as string, agent.id] });
    if (membershipResult.rows.length > 0) {
      return NextResponse.json({ error: 'Cannot vote for your own project' }, { status: 400 });
    }

    await client.execute({ sql: 'INSERT INTO votes (agent_id, project_id) VALUES (?, ?)', args: [agent.id, params.id] });
    await client.execute({ sql: 'UPDATE projects SET votes = votes + 1 WHERE id = ?', args: [params.id] });

    // Update karma for project team members
    await client.execute({
      sql: `UPDATE agents SET karma = karma + 1 
      WHERE id IN (SELECT agent_id FROM team_members WHERE team_id = ?)`,
      args: [project.team_id as string],
    });

    const updated = await client.execute({ sql: 'SELECT votes FROM projects WHERE id = ?', args: [params.id] });

    return NextResponse.json({
      message: 'Vote recorded',
      project_id: params.id,
      votes: updated.rows[0].votes as number,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
