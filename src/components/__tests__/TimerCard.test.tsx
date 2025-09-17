import { render, screen, fireEvent } from '@testing-library/react';
import { TimerCard } from '../dashboard/TimerCard';
import { DashboardTimer } from '@/types';

const mockTimer: DashboardTimer = {
  id: '1',
  status: 'RUNNING',
  note: 'Test timer',
  billable: true,
  startedAt: new Date().toISOString(),
  elapsedMs: 3600000, // 1 hour
  currentElapsedMs: 3600000,
  project: {
    id: 'p1',
    name: 'Test Project'
  }
};

const mockHandlers = {
  onPause: jest.fn(),
  onResume: jest.fn(),
  onComplete: jest.fn(),
  onCancel: jest.fn(),
  formatDuration: jest.fn((ms) => '1:00:00')
};

describe('TimerCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders timer information correctly', () => {
    render(<TimerCard timer={mockTimer} {...mockHandlers} />);
    
    expect(screen.getByText('1:00:00')).toBeInTheDocument();
    expect(screen.getByText('Test timer')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Billable')).toBeInTheDocument();
  });

  it('shows pause button for running timer', () => {
    render(<TimerCard timer={mockTimer} {...mockHandlers} />);
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
  });

  it('calls onPause when pause button is clicked', () => {
    render(<TimerCard timer={mockTimer} {...mockHandlers} />);
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    expect(mockHandlers.onPause).toHaveBeenCalledWith('1');
  });

  it('shows play button for paused timer', () => {
    const pausedTimer = { ...mockTimer, status: 'PAUSED' as const };
    render(<TimerCard timer={pausedTimer} {...mockHandlers} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
  });

  it('applies correct styling for running timer', () => {
    render(<TimerCard timer={mockTimer} {...mockHandlers} />);
    
    const card = screen.getByText('1:00:00').closest('.border-green-200');
    expect(card).toBeInTheDocument();
  });
});