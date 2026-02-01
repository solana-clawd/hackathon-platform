import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';


export async function GET(request: NextRequest) {
  try {
    await getDb();
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');
    const hackathonId = searchParams.get('hackathon_id');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'votes';

    // Build query with conditional filters
    // Since @vercel/postgres uses template literals, we handle combinations
    let result;
    
    if (track && hackathonId && status) {
      result = sort === 'newest' 
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} AND p.hackathon_id = ${hackathonId} AND p.status = ${status} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} AND p.hackathon_id = ${hackathonId} AND p.status = ${status} ORDER BY p.votes DESC`;
    } else if (track && hackathonId) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} AND p.hackathon_id = ${hackathonId} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} AND p.hackathon_id = ${hackathonId} ORDER BY p.votes DESC`;
    } else if (track && status) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} AND p.status = ${status} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} AND p.status = ${status} ORDER BY p.votes DESC`;
    } else if (hackathonId && status) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.hackathon_id = ${hackathonId} AND p.status = ${status} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.hackathon_id = ${hackathonId} AND p.status = ${status} ORDER BY p.votes DESC`;
    } else if (track) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${track} ORDER BY p.votes DESC`;
    } else if (hackathonId) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.hackathon_id = ${hackathonId} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.hackathon_id = ${hackathonId} ORDER BY p.votes DESC`;
    } else if (status) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.status = ${status} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.status = ${status} ORDER BY p.votes DESC`;
    } else {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id ORDER BY p.votes DESC`;
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, track, repo_url, demo_url, video_url, tech_stack, team_id, hackathon_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
    }
    if (!hackathon_id) {
      return NextResponse.json({ error: 'hackathon_id is required' }, { status: 400 });
    }

    await getDb();

    const membershipResult = await sql`SELECT * FROM team_members WHERE team_id = ${team_id} AND agent_id = ${agent.id}`;
    if (membershipResult.rows.length === 0) {
      return NextResponse.json({ error: 'You must be a team member to submit a project' }, { status: 403 });
    }

    const id = uuidv4();
    await sql`INSERT INTO projects (id, name, description, track, repo_url, demo_url, video_url, tech_stack, team_id, hackathon_id, status)
      VALUES (${id}, ${name}, ${description || null}, ${track || null}, ${repo_url || null}, ${demo_url || null}, ${video_url || null}, ${tech_stack ? JSON.stringify(tech_stack) : null}, ${team_id}, ${hackathon_id}, ${'draft'})`;

    return NextResponse.json({
      id,
      name,
      status: 'draft',
      message: 'Project created as draft. Update and submit when ready.',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
