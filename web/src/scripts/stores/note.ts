import { defineStore } from "pinia";
import { ref } from "vue";
import type { FsNode, FileDetail } from "@/scripts/types";

import { mockNote } from '@/scripts/mock';
import { mockTree } from "@/scripts/mock";
import { getTargetDirPath } from "@/scripts/utils/util";

export const useNodeStore = defineStore('note', () => {
  const currentNode = ref<FsNode | null>(null)
  const currentFile = ref<FileDetail>({
    name: 'WELCOME',
    path: '',
    suffix: '',
    content: 'HI, THIS IS MARKOUN',
    meta: {}
  })
  
  const nodeTree = ref<FsNode[]>([])

  const refrestNodeTree = async () => {
    nodeTree.value = mockTree
  }

  const refreshCurrentFile = async (node: FsNode) => {
    if (node.type === 'file' && node.path !== currentFile.value?.path) {
      currentFile.value = {
        name: node.name,
        path: node.path,
        suffix: "md",
        content: mockNote[node.path] ?? "",
        meta: {
          "type": node.type,
          "path": node.path
        }
      }
    }
  }

  const addNewNode = async (noteName: string, type: 'file' | 'dir') => {
    // 取得当前节点位置，创建节点（后端实现）
    const currentPath = getTargetDirPath(currentNode.value)

    console.log('current path', currentPath)

    mockTree.push({
      name: noteName,
      path: currentPath + '/' + noteName,
      type: type
    })
    currentFile.value = {
        name: noteName,
        path: currentPath + '/' + noteName,
        suffix: 'md',
        content: '',
        meta: {
          'type': type,
          'path': currentPath + '/' + noteName
        }
      }

    await refrestNodeTree()
  }

  const setCurrentNode = async (node: FsNode) => {
    currentNode.value = node
    if (node.type === 'file') {
      await refreshCurrentFile(node)
    }
  }

  return { 
    currentNode, currentFile, nodeTree, 
    refrestNodeTree, refreshCurrentFile, addNewNode, setCurrentNode 
  }
});

