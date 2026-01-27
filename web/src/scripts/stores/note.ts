import { defineStore } from "pinia";
import { ref } from "vue";
import type { FsNode, FileDetail } from "@/scripts/types";

import { getTargetDirPath } from "@/scripts/utils/util";
import { getFileTreeReq, getFileDetailReq, createNoteReq, createFolderReq } from "@/api/file";

export const useNodeStore = defineStore('note', () => {
  const nodeTree = ref<FsNode[]>([])
  const currentNode = ref<FsNode | null>(null)
  const currentFile = ref<FileDetail>({
    name: 'WELCOME',
    path: '',
    suffix: '',
    content: 'HI, THIS IS MARKOUN',
    meta: {}
  })
  

  const refrestNodeTree = async () => {
    const response = await getFileTreeReq()
    console.log('tree', response.data)
    nodeTree.value = response.data
  }

  const refreshCurrentFile = async (node: FsNode) => {
    if (node.type === 'file' && node.path !== currentFile.value?.path) {
      const response = await getFileDetailReq(node.path)
      console.log(response.data)
      currentFile.value = {
        name: node.name,
        path: node.path,
        suffix: node.suffix,
        content: response.data.content,
        meta: response.data.meta
      }
    }
  }

  const addNewNode = async (noteName: string, type: 'file' | 'dir') => {
    const currentPath = getTargetDirPath(currentNode.value)

    console.log('current path', currentPath)
    const response =
      type === 'file'
        ? await createNoteReq(currentPath, noteName)
        : await createFolderReq(currentPath, noteName)

    await refrestNodeTree()
    await setCurrentNode(response.data)
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

