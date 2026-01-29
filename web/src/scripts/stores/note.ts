import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import type { FsNode, FileDetail } from "@/scripts/types";
import { useNoticeStore } from "@/scripts/stores/notice";
import { getTargetDirPath } from "@/scripts/utils/util";
import { 
  getFileTreeReq, 
  getFileDetailReq, 
  createNoteReq, 
  createFolderReq, 
  uploadFileReq 
} from "@/api/file";

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
  const currentPath = computed(() => getTargetDirPath(currentNode.value))

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

    console.log('current path', currentPath)
    const response =
      type === 'file'
        ? await createNoteReq(currentPath.value, noteName)
        : await createFolderReq(currentPath.value, noteName)

    await refrestNodeTree()
    await setCurrentNode(response.data)
  }

  const setCurrentNode = async (node: FsNode) => {
    if (node.type === 'file' && node.suffix.toLowerCase() === 'md') {
      currentNode.value = node
      await refreshCurrentFile(node)
    } else if (node.type === 'dir') {
      currentNode.value = node
    } else {
      const noticeStore = useNoticeStore()
      noticeStore.pushNotice('warning', `WARNING: The selected object cannot be opened.`)
    }
  }

  const uploadFile = async (file: File, uploadPercent: Ref<number, number>) => {
    await uploadFileReq(currentPath.value, file, (percent) => {
      uploadPercent.value = percent
    })
    await refrestNodeTree()
    const noticeStore = useNoticeStore()
    noticeStore.pushNotice('info', `File upload successfully.`)
  }

  return { 
    nodeTree, currentNode, currentFile, currentPath,  
    refrestNodeTree, refreshCurrentFile, addNewNode, setCurrentNode, uploadFile
  }
});

