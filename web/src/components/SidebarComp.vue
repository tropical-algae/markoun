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
        <FileNodeComp v-for="item in mockTree" :key="item.path" :node="item" :depth="1" />
      </div>
    </div>

    <div class="vertical-line turn-right"></div>
  </aside>
</template>

<script setup lang="ts">
import NewNoteIcon from "@/assets/icons/add-document.svg"
import NewFolderIcon from "@/assets/icons/folder-plus-circle.svg"
import UploadIcon from "@/assets/icons/cloud-upload-alt.svg"
import TrashIcon from "@/assets/icons/trash.svg"

import FileTreeIcon from "@/assets/icons/rectangle-list.svg"
import SettingIcon from "@/assets/icons/settings.svg"


import FileNodeComp from "./FileNodeComp.vue";
import { mockTree } from "@/scripts/mock"

function onCreateNewPage() {

} 

const sideBtns = [
  { icon: FileTreeIcon, func: onCreateNewPage },
  { icon: SettingIcon, func: onCreateNewPage }
]

const toolBtns = [
  { icon: NewNoteIcon, func: onCreateNewPage },
  { icon: NewFolderIcon, func: onCreateNewPage },
  { icon: UploadIcon, func: onCreateNewPage },
  { icon: TrashIcon, func: onCreateNewPage },

]

</script>


