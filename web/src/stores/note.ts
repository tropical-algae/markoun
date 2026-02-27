import { defineStore } from "pinia";
import { computed, ref, type Ref } from "vue";
import type { FsNode, FileDetail } from "@/types/file-system";
import { useNoticeStore } from "@/stores/notice";
import { getParentPath, getMediaPath } from "@/utils/file-system";
import { getFileContentApi, createNoteApi, uploadFileApi, saveNoteApi } from "@/api/file";
import { getFileTreeApi, removeItemApi, renameItemApi } from "@/api/item";
import { createDirApi } from "@/api/dir";
import marked from "@/utils/markdown";
import { Renderer } from "marked";

export const useNodeStore = defineStore('note', () => {
  const defaultFileContent = {
    name: 'WELCOME',
    path: '',
    suffix: '',
    content: '## Hi, this is Markoun\n\nA clean and powerful online Markdown editor.',
    meta: {}
  }

  const nodeTree = ref<FsNode[]>([])
  const currentNode = ref<FsNode | null>(null)
  const currentFileNode = ref<FsNode | null>(null)

  const currentFile = ref<FileDetail>(defaultFileContent)
  const currentParentPath = computed(() => getParentPath(currentNode.value))
  const currrentRenderedFile = computed(() => renderCurrentFileContent())

  var isInitialized = false

  const noticeStore = useNoticeStore()

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
    const response = await getFileTreeApi()
    nodeTree.value = response.data
  }

  const refreshCurrentFile = async (node: FsNode) => {
    if (node.type === 'file' && node.path !== currentFile.value?.path) {
      const response = await getFileContentApi(node.path)
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
        ? await createNoteApi(currentParentPath.value, noteName)
        : await createDirApi(currentParentPath.value, noteName)

    await refrestNodeTree()
    await setCurrentNode(response.data)
  }

  const setCurrentNode = async (node: FsNode) => {
    if (node.type === 'file' && node.suffix.toLowerCase() === 'md') {
      await refreshCurrentFile(node)
      currentNode.value = node
      currentFileNode.value = node
      isInitialized = true
    } else if (node.type === 'dir') {
      currentNode.value = node
    } else {
      noticeStore.pushNotice('warning', `WARNING: The selected object cannot be opened.`)
    }
  }

  const uploadFile = async (file: File, uploadPercent: Ref<number, number>): Promise<string> => {
    const response = await uploadFileApi(currentParentPath.value, file, (percent) => {
      uploadPercent.value = percent
    })
    await refrestNodeTree()
    noticeStore.pushNotice('info', `File upload successfully.`)
    return response.data.filename
  }

  const saveCurrentFile = async (): Promise<void> => {
    if (!isInitialized) {
      noticeStore.pushNotice('warning', 'The home page cannot be changed.')
      return
    }
    const response = await saveNoteApi(currentFile.value.path, currentFile.value.content)
    currentFile.value.meta = response.data
    noticeStore.pushNotice('info', 'The note has been saved.')
  } 

  const deletedItem = async (): Promise<void> => {
    if (currentNode.value === null) {
      noticeStore.pushNotice('warning', 'No file / folder selected.')
      return
    } else {
      const response = await removeItemApi(currentNode.value.path)
      const nodeType = currentNode.value.type === 'file' ? 'File' : 'Folder'
      if (response.status !== 200) {
        return
      }
      if (currentNode.value.path === currentFile.value.path) {
        // 当前选中节点即为打开的文件，删除后还原初始化状态
        currentNode.value = null;
        currentFileNode.value = null;
        currentFile.value = defaultFileContent;
        isInitialized = false;
      } else {
        // 当前选中节点非打开的文件，删除后设选中节点为文件
        currentNode.value = currentFileNode.value;
      }
      noticeStore.pushNotice('info', `${nodeType} has been deleted.`)
      await refrestNodeTree()
    }
  }

  const renameNode = async (path: string, new_name: string): Promise<void> => {
    if (currentFile.value.path.startsWith(path)) {
      currentFileNode.value = null;
      currentFile.value = defaultFileContent;
      isInitialized = false;
    }
    if (currentNode?.value?.path.startsWith(path)) {
      currentNode.value = currentFileNode.value;
    }
    await renameItemApi(path, new_name)
    noticeStore.pushNotice('info', "Rename successful!")
    await refrestNodeTree()
  }

  return { 
    nodeTree, currentNode, currentFile, currentPath: currentParentPath, currrentRenderedFile,
    refrestNodeTree, refreshCurrentFile, addNewNode, setCurrentNode, uploadFile, saveCurrentFile, deletedItem, renameNode
  }
});

