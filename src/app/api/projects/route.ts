import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { withCache, CacheConfigs, CacheInvalidator } from '@/lib/middleware/cacheMiddleware';
import { ProjectService } from '@/lib/services/ProjectService';
import { parsePaginationParams, createPaginatedResponse } from '@/lib/utils/pagination';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  client: z.string().optional().transform(val => val === '' ? undefined : val),
  description: z.string().optional(),
  color: z.string().optional(),
});

const projectService = new ProjectService();

const getProjectsHandler = async (request: NextRequest, { userId }: { userId: string }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const archived = searchParams.get('archived') === 'true';
  
  // Parse pagination parameters
  const paginationParams = parsePaginationParams(searchParams);
  
  const filters = {
    ...(query && { query }),
    archived,
  };

  const result = await projectService.getProjects(userId, filters, paginationParams);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to fetch projects' },
      { status: 400 }
    );
  }

  return NextResponse.json({ data: result.data });
};

export const GET = withAuth(async (request: NextRequest, context: { userId: string }) => {
  return getProjectsHandler(request, context);
});


export const POST = withAuth(async (request: NextRequest, { userId }: { userId: string }) => {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const result = await projectService.createProject({
      ...validatedData,
      userId
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create project' },
        { status: 500 }
      );
    }

    // Invalidate projects cache after creating new project
    CacheInvalidator.invalidateProjects(userId);

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});