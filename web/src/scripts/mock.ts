import type { FsNode } from '@/scripts/types';

export const mockTree: FsNode[] = [
  { name: 'README.md', path: '/README.md', type: 'file' },
  { name: 'Supported Devices.md', path: '/devices.md', type: 'file' },
  { 
    name: 'Projects', 
    path: '/projects', 
    type: 'dir',
    children: [
      { name: 'Web-App.md', path: '/projects/web.md', type: 'file' },
      { name: 'Mobile-App.md', path: '/projects/mobile.md', type: 'file' }
    ]
  },
  { name: 'hello-world.md', path: '/hello.md', type: 'file' },
];


export const mockNote: Record<string, string> = {
  "/README.md": "111111",
  "/devices.md": "2222",
  "/projects/web.md": "33333",
  "/projects/mobile.md": "44444",
  "/hello.md": "55555"
};

