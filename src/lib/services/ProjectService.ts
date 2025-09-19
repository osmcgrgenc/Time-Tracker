import { BaseService } from './base/BaseService';
import { ProjectRepository, ProjectFilters, ProjectWithStats } from '../repositories/ProjectRepository';
import { ServiceResult, PaginationOptions } from './base/IService';
import { Project } from '@prisma/client';

export interface CreateProjectData {
  name: string;
  description?: string;
  color?: string;
  userId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  color?: string;
  archived?: boolean;
}

export class ProjectService extends BaseService {
  readonly serviceName = 'ProjectService';
  private projectRepository: ProjectRepository;

  constructor() {
    super();
    this.projectRepository = new ProjectRepository();
  }

  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Valid user ID is required');
    }
  }

  private validateId(id: string, fieldName: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error(`Valid ${fieldName} is required`);
    }
  }

  private validateRequiredField(value: any, fieldName: string): void {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${fieldName} is required`);
    }
  }

  async getProjects(
    userId: string,
    filters: ProjectFilters = {},
    pagination?: PaginationOptions
  ): Promise<ServiceResult<ProjectWithStats[]>> {
    try {
      this.validateUserId(userId);

      const projects = await this.projectRepository.findByUserId(
        userId,
        filters,
        pagination
      );

      this.logOperation('Projects retrieved successfully', userId, {
        count: projects.length,
        filters
      });

      return this.createSuccessResult(projects);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProjectById(
    userId: string,
    projectId: string
  ): Promise<ServiceResult<ProjectWithStats | null>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      const projects = await this.projectRepository.findByUserId(
        userId,
        {},
        undefined
      );

      const project = projects.find(p => p.id === projectId);

      if (!project) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      this.logOperation('Project retrieved successfully', userId, {
        projectId
      });

      return this.createSuccessResult(project);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createProject(
    data: CreateProjectData
  ): Promise<ServiceResult<Project>> {
    try {
      this.validateUserId(data.userId);
      this.validateRequiredField(data.name, 'Project name');

      if (data.name.length < 1 || data.name.length > 100) {
        return this.createErrorResult('VALIDATION_ERROR', 'Project name must be between 1 and 100 characters');
      }

      // Check if project with same name already exists
      const existingProject = await this.projectRepository.findByUserIdAndName(
        data.userId,
        data.name
      );

      if (existingProject) {
        return this.createErrorResult('VALIDATION_ERROR', 'A project with this name already exists');
      }

      const project = await this.projectRepository.create({
        name: data.name.trim(),
        description: data.description?.trim(),
        color: data.color || '#3B82F6',
        owner: { connect: { id: data.userId } },
        archived: false
      });

      this.logOperation('Project created successfully', data.userId, {
        projectId: project.id,
        name: data.name
      });

      return this.createSuccessResult(project);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateProject(
    userId: string,
    projectId: string,
    data: UpdateProjectData
  ): Promise<ServiceResult<Project>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      // Check if project exists and belongs to user
      const existingProject = await this.projectRepository.findById(projectId);
      if (!existingProject || existingProject.ownerId !== userId) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      // Validate name if provided
      if (data.name !== undefined) {
        if (data.name.length < 1 || data.name.length > 100) {
          return this.createErrorResult('VALIDATION_ERROR', 'Project name must be between 1 and 100 characters');
        }

        // Check if another project with same name exists
        if (data.name !== existingProject.name) {
          const duplicateProject = await this.projectRepository.findByUserIdAndName(
            userId,
            data.name
          );
          if (duplicateProject && duplicateProject.id !== projectId) {
            return this.createErrorResult('VALIDATION_ERROR', 'A project with this name already exists');
          }
        }
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim();
      if (data.color !== undefined) updateData.color = data.color;
      if (data.archived !== undefined) updateData.archived = data.archived;

      const updatedProject = await this.projectRepository.update(projectId, updateData);

      if (!updatedProject) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      this.logOperation('Project updated successfully', userId, {
        projectId,
        updates: Object.keys(updateData)
      });

      return this.createSuccessResult(updatedProject);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteProject(
    userId: string,
    projectId: string
  ): Promise<ServiceResult<void>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      // Check if project exists and belongs to user
      const existingProject = await this.projectRepository.findById(projectId);
      if (!existingProject || existingProject.ownerId !== userId) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      await this.projectRepository.delete(projectId);

      this.logOperation('Project deleted successfully', userId, {
        projectId
      });

      return this.createSuccessResult(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async archiveProject(
    userId: string,
    projectId: string
  ): Promise<ServiceResult<Project>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      const archivedProject = await this.projectRepository.archiveProject(userId, projectId);

      if (!archivedProject) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      this.logOperation('Project archived successfully', userId, {
        projectId
      });

      return this.createSuccessResult(archivedProject);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async unarchiveProject(
    userId: string,
    projectId: string
  ): Promise<ServiceResult<Project>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      const unarchivedProject = await this.projectRepository.unarchiveProject(userId, projectId);

      if (!unarchivedProject) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      this.logOperation('Project unarchived successfully', userId, {
        projectId
      });

      return this.createSuccessResult(unarchivedProject);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getProjectStats(
    userId: string,
    projectId: string
  ): Promise<ServiceResult<{
    totalTime: number;
    timerCount: number;
    taskCount: number;
    completedTasks: number;
  }>> {
    try {
      this.validateUserId(userId);
      this.validateId(projectId, 'Project ID');

      const stats = await this.projectRepository.getProjectStats(userId, projectId);

      if (!stats) {
        return this.createErrorResult('NOT_FOUND', 'Project not found');
      }

      this.logOperation('Project stats retrieved successfully', userId, {
        projectId
      });

      return this.createSuccessResult(stats);
    } catch (error) {
      return this.handleError(error);
    }
  }
}