
import { useState, useEffect, useCallback } from 'react';
import { trpc } from './utils/trpc';
import { AuthScreen } from './components/AuthScreen';
import { TaskList } from './components/TaskList';
import { CreateTaskForm } from './components/CreateTaskForm';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { LogOut, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { Task, AuthResponse } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const loadTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const filters: { completed?: boolean; priority?: 'low' | 'medium' | 'high' } = {};
      
      if (filter === 'completed') filters.completed = true;
      if (filter === 'pending') filters.completed = false;
      if (priorityFilter !== 'all') filters.priority = priorityFilter;

      const result = await trpc.getTasks.query(filters);
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filter, priorityFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleLogin = (authResponse: AuthResponse) => {
    setUser(authResponse.user);
  };

  const handleLogout = () => {
    setUser(null);
    setTasks([]);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleTaskDeleted = (taskId: number) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <AuthScreen onLogin={handleLogin} />
      </div>
    );
  }

  const completedCount = tasks.filter(task => task.completed).length;
  const pendingCount = tasks.filter(task => !task.completed).length;
  const highPriorityCount = tasks.filter(task => task.priority === 'high' && !task.completed).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">✅ Task Manager</h1>
            <p className="text-gray-600">Welcome back, {user.username}!</p>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Tasks</p>
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Tasks</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Task Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Create New Task</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateTaskForm onTaskCreated={handleTaskCreated} />
              </CardContent>
            </Card>
          </div>

          {/* Task List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'completed' | 'pending')}>
                    <TabsList>
                      <TabsTrigger value="all">All Tasks</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Priority:</span>
                    <Button
                      variant={priorityFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={priorityFilter === 'low' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter('low')}
                    >
                      <Badge variant="secondary" className="text-xs">Low</Badge>
                    </Button>
                    <Button
                      variant={priorityFilter === 'medium' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter('medium')}
                    >
                      <Badge variant="default" className="text-xs">Medium</Badge>
                    </Button>
                    <Button
                      variant={priorityFilter === 'high' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPriorityFilter('high')}
                    >
                      <Badge variant="destructive" className="text-xs">High</Badge>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading tasks...</p>
                  </div>
                ) : (
                  <TaskList
                    tasks={tasks}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
