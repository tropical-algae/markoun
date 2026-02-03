import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import type { FsNode, FileDetail } from "@/scripts/types";
import { useNoticeStore } from "@/scripts/stores/notice";
import { getParentPath, getMediaPath } from "@/scripts/utils/util";
import { 
  getFileTreeReq, 
  getFileDetailReq, 
  createNoteReq, 
  createFolderReq, 
  uploadFileReq, 
  deletedItemReq,
  saveNoteReq
} from "@/api/file";
import marked from "@/scripts/utils/markdown";
import { Renderer } from "marked";

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
  const currentParentPath = computed(() => getParentPath(currentNode.value))
  const currrentRenderedFile = computed(() => renderCurrentFileContent())

  const renderCurrentFileContent = (): string => {
    const parentPath = getParentPath(currentFile.value.path);
    const customRenderer = new Renderer();
    customRenderer.image = ({ href, title, text }: any) => {
      const mediaPath = getMediaPath(parentPath, href);
      return `<img src="${mediaPath}" title="${title || ''}" alt="${text || ''}" />`;
    };

    return marked.parse(currentFile.value.content, { 
      renderer: customRenderer,
      async: false 
    });
  };

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
    const response =
      type === 'file'
        ? await createNoteReq(currentParentPath.value, noteName)
        : await createFolderReq(currentParentPath.value, noteName)

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

  const uploadFile = async (file: File, uploadPercent: Ref<number, number>): Promise<string> => {
    const response = await uploadFileReq(currentParentPath.value, file, (percent) => {
      uploadPercent.value = percent
    })
    console.log(response)
    await refrestNodeTree()
    const noticeStore = useNoticeStore()
    noticeStore.pushNotice('info', `File upload successfully.`)
    return response.data.filename
  }

  const saveCurrentFile = async (): Promise<void> => {
    const noticeStore = useNoticeStore()

    const response = await saveNoteReq(currentFile.value.path, currentFile.value.content)
    currentFile.value.meta = response.data
    noticeStore.pushNotice('info', 'The note has been saved.')
  } 

  const deletedItem = async (): Promise<void> => {
    const noticeStore = useNoticeStore()
    if (currentNode.value === null) {
      noticeStore.pushNotice('warning', 'No file / folder selected.')
      return
    } else {
      await deletedItemReq(currentNode.value.path)
      const nodeType = currentNode.value.type === 'file' ? 'File' : 'Folder'
      noticeStore.pushNotice('info', `${nodeType} has been deleted.`)
      await refrestNodeTree()
    }
  }

  return { 
    nodeTree, currentNode, currentFile, currentPath: currentParentPath, currrentRenderedFile,
    refrestNodeTree, refreshCurrentFile, addNewNode, setCurrentNode, uploadFile, saveCurrentFile, deletedItem
  }
});

