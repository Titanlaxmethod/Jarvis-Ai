
export interface AppTemplate {
  name: string;
  description: string;
  preview: string;
  features: string[];
  code: string;
}

class AppCreationService {
  getAppTemplate(appType: string): AppTemplate | null {
    const templates: Record<string, AppTemplate> = {
      'todo': {
        name: 'Todo App',
        description: 'A simple task management application',
        preview: 'A clean interface with add task button, task list with checkboxes, and delete functionality',
        features: ['Add new tasks', 'Mark tasks complete', 'Delete tasks', 'Task counter'],
        code: `import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">My Tasks</h1>
      <div className="flex gap-2 mb-4">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add new task..."
          onKeyPress={(e) => e.key === 'Enter' && addTask()}
        />
        <Button onClick={addTask}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => setTasks(tasks.map(t => 
                t.id === task.id ? {...t, completed: !t.completed} : t
              ))}
            />
            <span className={task.completed ? 'line-through text-gray-500' : ''}>
              {task.text}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};`
      },
      'weather': {
        name: 'Weather App',
        description: 'A weather information application',
        preview: 'Shows current weather, temperature, and 5-day forecast with weather icons',
        features: ['Current weather', 'Temperature display', '5-day forecast', 'Location search'],
        code: `import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Cloud, Sun, CloudRain } from 'lucide-react';

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState('New York');

  return (
    <div className="max-w-md mx-auto p-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg text-white">
      <h1 className="text-2xl font-bold mb-4">Weather App</h1>
      <div className="flex gap-2 mb-6">
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name..."
          className="text-black"
        />
        <Button variant="secondary">Search</Button>
      </div>
      <div className="text-center">
        <Sun className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-3xl font-bold">24°C</h2>
        <p className="text-xl">Sunny</p>
        <p className="text-sm opacity-80">New York</p>
      </div>
    </div>
  );
};`
      },
      'calculator': {
        name: 'Calculator App',
        description: 'A basic calculator application',
        preview: 'Clean calculator interface with number pad and basic operations',
        features: ['Basic arithmetic', 'Clear function', 'Decimal support', 'Keyboard input'],
        code: `import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const CalculatorApp = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);

  const inputNumber = (num) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
  };

  return (
    <div className="max-w-sm mx-auto p-6 bg-gray-800 rounded-lg">
      <div className="bg-black text-white text-right text-2xl p-4 rounded mb-4">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={clear} className="col-span-2">Clear</Button>
        <Button>±</Button>
        <Button>÷</Button>
        {[7,8,9].map(n => (
          <Button key={n} onClick={() => inputNumber(n.toString())}>{n}</Button>
        ))}
        <Button>×</Button>
        {[4,5,6].map(n => (
          <Button key={n} onClick={() => inputNumber(n.toString())}>{n}</Button>
        ))}
        <Button>-</Button>
        {[1,2,3].map(n => (
          <Button key={n} onClick={() => inputNumber(n.toString())}>{n}</Button>
        ))}
        <Button>+</Button>
        <Button onClick={() => inputNumber('0')} className="col-span-2">0</Button>
        <Button>.</Button>
        <Button>=</Button>
      </div>
    </div>
  );
};`
      }
    };

    return templates[appType.toLowerCase()] || null;
  }

  suggestAppType(description: string): string {
    const keywords = description.toLowerCase();
    
    if (keywords.includes('todo') || keywords.includes('task') || keywords.includes('list')) {
      return 'todo';
    }
    if (keywords.includes('weather') || keywords.includes('temperature') || keywords.includes('forecast')) {
      return 'weather';
    }
    if (keywords.includes('calculator') || keywords.includes('math') || keywords.includes('calculate')) {
      return 'calculator';
    }
    
    return 'todo'; // default
  }
}

export const appCreationService = new AppCreationService();
