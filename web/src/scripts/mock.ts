import type { FileNode } from '@/scripts/types';

export const mockTree: FileNode[] = [
  { name: 'README.md', path: '/README.md', type: 'file' },
  { name: 'Supported Devices.md', path: '/devices.md', type: 'file' },
  { 
    name: 'Projects', 
    path: '/projects', 
    type: 'directory',
    children: [
      { name: 'Web-App.md', path: '/projects/web.md', type: 'file' },
      { name: 'Mobile-App.md', path: '/projects/mobile.md', type: 'file' }
    ]
  },
  { name: 'hello-world.md', path: '/hello.md', type: 'file' },
];

