<template>
  <aside class="sidebar-container d-flex flex-row">
    <div class="sidebar-core d-flex flex-column gap-2 p-2">
      <button v-for="(item, _) in sideBtns" @click="item.func()">
        <component :is="item.icon" class="icon-btn"></component>
      </button>
      <div class="vertical-line turn-right"></div>
    </div>

    <div class="d-flex flex-column">
      <div class="file-tree-header d-flex justify-content-center align-items-center gap-2">
        <button v-for="(item, _) in toolBtns" @click="item.func()">
          <component :is="item.icon" class="icon-btn"></component>
        </button>
      </div>
      <div class="file-tree-container p-2 flex-grow-1">
        <FsNodeComp v-for="item in nodeStore.nodeTree" :key="item.path" :node="item" :depth="1" />
      </div>
    </div>

    <div class="vertical-line turn-right"></div>

    <CreateNoteModal v-model="showNewNote"/>
    <CreateDirModal v-model="showNewFolder"/>

  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import NewNoteIcon from "@/assets/icons/add-document.svg"
import NewFolderIcon from "@/assets/icons/folder-plus-circle.svg"
import UploadIcon from "@/assets/icons/cloud-upload-alt.svg"
import TrashIcon from "@/assets/icons/trash.svg"

import FileTreeIcon from "@/assets/icons/rectangle-list.svg"
import SettingIcon from "@/assets/icons/settings.svg"


import FsNodeComp from "@/components/FsNodeComp.vue";
import CreateNoteModal from "@/components/modals/CreateNoteModal.vue"
import CreateDirModal from "@/components/modals/CreateDirModal.vue"


import { useNodeStore } from "@/scripts/stores/note"

const nodeStore = useNodeStore()

const showNewNote = ref(false);
const showNewFolder = ref(false);


function runFunction() {
  console.log('run')
} 


const sideBtns = [
  { icon: FileTreeIcon, func: runFunction },
  { icon: SettingIcon, func: runFunction }
]

const toolBtns = [
  { icon: NewNoteIcon, func: () => { showNewNote.value = true } },
  { icon: NewFolderIcon, func: () => { showNewFolder.value = true } },
  { icon: UploadIcon, func: runFunction },
  { icon: TrashIcon, func: runFunction },

]

onMounted(async () => {
  await nodeStore.refrestNodeTree()
})

</script>


